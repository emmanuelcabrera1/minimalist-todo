/**
 * Life Compass - Mood History View
 * ============================================
 * History and trends for mood entries.
 */

const MoodHistory = {
    async show() {
        const trend = await MoodRepo.getTrend(14);
        const correlations = await MoodRepo.getActivityCorrelations();
        const dominant = await MoodRepo.getDominantEmotion(7);

        const trendHtml = trend.map((d, i) => {
            const height = d.valence !== null ? ((d.valence + 3) / 6 * 100) : 0;
            const color = d.valence >= 0 ? 'var(--success)' : 'var(--error)';
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="height:60px;width:100%;display:flex;align-items:flex-end;">
                    ${d.hasData ? `<div style="width:100%;height:${height}%;background:${color};border-radius:2px;"></div>` : ''}
                </div>
                <span style="font-size:10px;color:var(--text-tertiary)">${i % 2 === 0 ? d.date.split('-')[2] : ''}</span>
            </div>`;
        }).join('');

        const correlationsHtml = Object.entries(correlations).slice(0, 5).map(([activity, score]) => {
            const isPositive = score >= 0;
            return `<div class="mood-correlation">
                <span style="width:100px;font-size:var(--font-size-subhead)">${activity}</span>
                <div class="mood-correlation-bar"><div class="mood-correlation-fill ${isPositive ? 'positive' : 'negative'}" style="width:${Math.abs(score) / 3 * 100}%"></div></div>
                <span class="mood-correlation-value" style="color:${isPositive ? 'var(--success)' : 'var(--error)'}">${score > 0 ? '+' : ''}${score}</span>
            </div>`;
        }).join('');

        const content = `
            <div class="section">
                <h3 class="section-title">Last 14 Days</h3>
                <div class="mood-chart-container"><div style="display:flex;gap:2px;">${trendHtml}</div></div>
            </div>
            ${dominant ? `<div class="mood-insight-card"><div class="mood-insight-title">💡 This week</div><div class="mood-insight-content">You've mostly been feeling <strong>${dominant}</strong></div></div>` : ''}
            ${correlationsHtml ? `<div class="section"><h3 class="section-title">Activity Correlations</h3>${correlationsHtml}</div>` : ''}
        `;

        await Modal.show({ title: 'Mood Insights', content, type: 'full' });
    }
};

window.MoodHistory = MoodHistory;
