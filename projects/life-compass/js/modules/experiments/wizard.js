/**
 * Life Compass - Experiment Wizard
 * ============================================
 * Multi-step wizard for creating experiments.
 */

const ExperimentsWizard = {
    currentStep: 1,
    data: {},

    async start() {
        this.currentStep = 1;
        this.data = {};
        await this.showStep1();
    },

    async showStep1() {
        const content = `
            <div class="wizard-container">
                <div class="wizard-progress"><div class="wizard-progress-step active"></div><div class="wizard-progress-step"></div><div class="wizard-progress-step"></div></div>
                <h2 class="wizard-title">What have you observed?</h2>
                <p class="wizard-subtitle">Describe a pattern, problem, or opportunity you've noticed.</p>
                <form id="wizard-step1" onsubmit="ExperimentsWizard.nextStep(event)">
                    <div class="form-group">
                        <textarea class="form-input form-textarea" name="observation" rows="3" placeholder="I've noticed that..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">What do you think might help?</label>
                        <textarea class="form-input form-textarea" name="hypothesis" rows="2" placeholder="I believe that..."></textarea>
                    </div>
                </form>
            </div>
        `;
        const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button type="submit" form="wizard-step1" class="btn btn-primary">Next →</button>`;
        await Modal.show({ title: 'New Experiment', content, footer, type: 'full' });
    },

    async showStep2() {
        const categories = ['Health', 'Work', 'Relationships', 'Parenting', 'Creativity', 'Other'];
        const content = `
            <div class="wizard-container">
                <div class="wizard-progress"><div class="wizard-progress-step completed"></div><div class="wizard-progress-step active"></div><div class="wizard-progress-step"></div></div>
                <h2 class="wizard-title">Define your experiment</h2>
                <p class="wizard-subtitle">What will you try?</p>
                <form id="wizard-step2" onsubmit="ExperimentsWizard.nextStep(event)">
                    <div class="form-group">
                        <label class="form-label">Experiment name</label>
                        <input type="text" class="form-input" name="title" placeholder="Morning meditation" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-input" name="category">${categories.map(c => `<option value="${c.toLowerCase()}">${c}</option>`).join('')}</select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Emoji</label>
                        <input type="text" class="form-input" name="emoji" value="🧪" maxlength="2">
                    </div>
                </form>
            </div>
        `;
        const footer = `<button class="btn btn-secondary" onclick="ExperimentsWizard.prevStep()">← Back</button><button type="submit" form="wizard-step2" class="btn btn-primary">Next →</button>`;
        await Modal.show({ title: 'New Experiment', content, footer, type: 'full' });
    },

    async showStep3() {
        const content = `
            <div class="wizard-container">
                <div class="wizard-progress"><div class="wizard-progress-step completed"></div><div class="wizard-progress-step completed"></div><div class="wizard-progress-step active"></div></div>
                <h2 class="wizard-title">Your PACT</h2>
                <p class="wizard-subtitle">Define a small, actionable commitment.</p>
                <form id="wizard-step3" onsubmit="ExperimentsWizard.submit(event)">
                    <div class="form-group">
                        <label class="form-label">I will...</label>
                        <textarea class="form-input form-textarea" name="action" rows="2" placeholder="Meditate for 5 minutes after waking up" required></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">For how many days?</label>
                        <input type="number" class="form-input" name="durationValue" value="21" min="7" max="90">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Frequency</label>
                        <select class="form-input" name="frequency"><option value="daily">Every day</option><option value="weekdays">Weekdays only</option></select>
                    </div>
                </form>
            </div>
        `;
        const footer = `<button class="btn btn-secondary" onclick="ExperimentsWizard.prevStep()">← Back</button><button type="submit" form="wizard-step3" class="btn btn-primary" style="background:var(--accent-experiments)">Start Experiment</button>`;
        await Modal.show({ title: 'New Experiment', content, footer, type: 'full' });
    },

    async nextStep(event) {
        event.preventDefault();
        const fd = new FormData(event.target);
        for (const [key, value] of fd.entries()) { this.data[key] = value; }
        this.currentStep++;
        if (this.currentStep === 2) { await this.showStep2(); }
        else if (this.currentStep === 3) { await this.showStep3(); }
    },

    async prevStep() {
        this.currentStep--;
        if (this.currentStep === 1) { await this.showStep1(); }
        else if (this.currentStep === 2) { await this.showStep2(); }
    },

    async submit(event) {
        event.preventDefault();
        const fd = new FormData(event.target);
        for (const [key, value] of fd.entries()) { this.data[key] = value; }

        try {
            await ExperimentsRepo.create(this.data);
            Modal.close();
            Toast.success('Experiment started!');
            Navigation.renderModule('experiments');
        } catch (error) {
            Toast.error('Failed to create experiment');
        }
    }
};

window.ExperimentsWizard = ExperimentsWizard;
