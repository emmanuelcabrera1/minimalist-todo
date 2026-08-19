/**
 * Life Compass - Experiments Lab View
 * ============================================
 * Today's active experiments and check-in interface.
 */

const ExperimentsLab = {
    async render() {
        const active = await ExperimentsRepo.getActive();
        const needingCheckin = await ExperimentsRepo.getNeedingCheckin();

        if (active.length === 0) {
            return `
                <div class="screen-header">
                    <h1 class="screen-title">Lab</h1>
                </div>
                ${Components.emptyState('🧪', 'Start experimenting', 'Life is a series of tiny experiments. Start your first one today!', 'New Experiment', 'ExperimentsWizard.start()')}
            `;
        }

        const experimentsHtml = await Promise.all(active.map(async exp => {
            const progress = await ExperimentsRepo.getProgress(exp.id);
            const needsCheckin = needingCheckin.some(e => e.id === exp.id);
            return this.renderCard(exp, progress, needsCheckin);
        }));

        return `
            <div class="screen-header">
                <h1 class="screen-title">Lab</h1>
                <button class="btn-icon btn-ghost" onclick="ExperimentsWizard.start()" aria-label="New">+</button>
            </div>
            ${needingCheckin.length > 0 ? `<div class="badge badge-warning mb-md">${needingCheckin.length} needs check-in</div>` : ''}
            <div class="stagger-children">${experimentsHtml.join('')}</div>
        `;
    },

    init() { },

    renderCard(exp, progress, needsCheckin) {
        return `
            <div class="experiment-card" data-id="${exp.id}">
                <div class="experiment-header">
                    <div class="experiment-progress-ring">
                        ${Components.progressRing(progress.percentage, 60, '--accent-experiments')}
                        <span class="experiment-progress-percent">${progress.percentage}%</span>
                    </div>
                    <div class="experiment-info" onclick="ExperimentsLab.openExperiment('${exp.id}')">
                        <div class="experiment-title"><span class="experiment-emoji">${exp.emoji}</span> ${Utils.escapeHtml(exp.title)}</div>
                        <div class="experiment-subtitle">Day ${progress.daysCompleted} of ${progress.daysTotal}</div>
                    </div>
                </div>
                <div class="pact-display">
                    <p class="pact-action">"${Utils.escapeHtml(exp.pact.action)}"</p>
                    <div class="pact-meta"><span>🔥 ${progress.currentStreak} days</span>${Components.categoryBadge(exp.category)}</div>
                </div>
                <div class="experiment-actions">
                    ${needsCheckin ? `<button class="experiment-action-btn primary" onclick="ExperimentsLab.checkin('${exp.id}')">✓ Check In</button>` : `<button class="experiment-action-btn" disabled>✓ Done</button>`}
                    <button class="experiment-action-btn" onclick="ExperimentsLab.openReflect('${exp.id}')">✏️ Reflect</button>
                </div>
            </div>
        `;
    },

    async checkin(experimentId) {
        const exp = await ExperimentsRepo.get(experimentId);
        const content = `<div class="checkin-modal"><div style="font-size:64px">${exp.emoji}</div><h3 class="checkin-question">Did you do it today?</h3><p class="checkin-pact">"${Utils.escapeHtml(exp.pact.action)}"</p><div class="checkin-buttons"><button class="checkin-btn no" onclick="ExperimentsLab.submitCheckin('${experimentId}',false)">✕</button><button class="checkin-btn yes" onclick="ExperimentsLab.submitCheckin('${experimentId}',true)">✓</button></div></div>`;
        await Modal.show({ content, type: 'center' });
    },

    async submitCheckin(experimentId, completed) {
        await ExperimentsRepo.logCheckin(experimentId, { completed });
        Modal.close();
        Utils.haptic(completed ? 'success' : 'medium');
        Toast.success(completed ? 'Great job!' : 'Logged. Tomorrow is new!');
        const progress = await ExperimentsRepo.getProgress(experimentId);
        if (progress.isComplete) { setTimeout(() => this.promptCompletion(experimentId), 500); }
        else { Navigation.renderModule('experiments'); }
    },

    async promptCompletion(experimentId) {
        const exp = await ExperimentsRepo.get(experimentId);
        const content = `<div style="text-align:center;padding:var(--space-lg)"><div style="font-size:64px">🎉</div><h2 class="text-title-2 mt-md">Experiment Complete!</h2><p class="text-secondary mt-sm">${Utils.escapeHtml(exp.title)}</p><div class="outcome-options mt-lg"><div class="outcome-option" onclick="ExperimentsLab.complete('${experimentId}','persist')"><div class="outcome-icon">🌱</div><div class="outcome-title">Persist</div><div class="outcome-description">Make it a habit</div></div><div class="outcome-option" onclick="ExperimentsLab.complete('${experimentId}','pause')"><div class="outcome-icon">⏸️</div><div class="outcome-title">Pause</div><div class="outcome-description">Revisit later</div></div><div class="outcome-option" onclick="ExperimentsLab.complete('${experimentId}','pivot')"><div class="outcome-icon">🔄</div><div class="outcome-title">Pivot</div><div class="outcome-description">Try different</div></div></div></div>`;
        await Modal.show({ content, type: 'full' });
    },

    async complete(experimentId, outcome) {
        await ExperimentsRepo.complete(experimentId, { outcome, createHabit: outcome === 'persist' });
        Modal.close();
        Toast.success(outcome === 'persist' ? 'Habit created!' : 'Experiment ' + outcome + 'd');
        Navigation.renderModule('experiments');
    },

    async openReflect(experimentId) {
        const content = `<form id="reflect-form" onsubmit="ExperimentsLab.submitReflection(event,'${experimentId}')"><div class="reflection-section"><label class="reflection-label plus">➕ What's working?</label><textarea class="form-input form-textarea" name="plus" rows="2"></textarea></div><div class="reflection-section"><label class="reflection-label minus">➖ What's not?</label><textarea class="form-input form-textarea" name="minus" rows="2"></textarea></div><div class="reflection-section"><label class="reflection-label next">➡️ What's next?</label><textarea class="form-input form-textarea" name="next" rows="2"></textarea></div></form>`;
        const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button type="submit" form="reflect-form" class="btn btn-primary">Save</button>`;
        await Modal.show({ title: 'Reflect', content, footer, type: 'full' });
    },

    async submitReflection(event, experimentId) {
        event.preventDefault();
        const fd = new FormData(event.target);
        await ExperimentsRepo.addReflection(experimentId, { plus: fd.get('plus'), minus: fd.get('minus'), next: fd.get('next') });
        Modal.close();
        Toast.success('Reflection saved!');
    },

    async openExperiment(experimentId) {
        Toast.info('Experiment details coming soon!');
    }
};

window.ExperimentsLab = ExperimentsLab;
