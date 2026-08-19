/**
 * Experiments - Accountability Partners System
 * Connect with partners for mutual accountability
 */

const PARTNERS_KEY = 'experiments_partners';

const PartnersManager = {
    /**
     * Load partners data
     */
    load() {
        try {
            return JSON.parse(localStorage.getItem(PARTNERS_KEY) || '{"partners": [], "myShareCode": null}');
        } catch (e) {
            console.error('Failed to load partners:', e);
            return { partners: [], myShareCode: null };
        }
    },

    /**
     * Save partners data
     */
    save(data) {
        localStorage.setItem(PARTNERS_KEY, JSON.stringify(data));
    },

    /**
     * Generate unique share code
     */
    generateShareCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    /**
     * Get or create my share code
     */
    getMyShareCode() {
        const data = this.load();
        if (!data.myShareCode) {
            data.myShareCode = this.generateShareCode();
            this.save(data);
        }
        return data.myShareCode;
    },

    /**
     * Add a partner
     */
    addPartner(name, shareCode) {
        const data = this.load();

        // Check if partner already exists
        if (data.partners.some(p => p.shareCode === shareCode)) {
            return { success: false, error: 'Partner with this code already exists' };
        }

        const partner = {
            id: 'partner_' + Date.now(),
            name: name.trim(),
            shareCode: shareCode.toUpperCase(),
            connectedAt: new Date().toISOString(),
            sharedExperiments: [],
            lastUpdate: null
        };

        data.partners.push(partner);
        this.save(data);

        return { success: true, partner };
    },

    /**
     * Remove a partner
     */
    removePartner(partnerId) {
        const data = this.load();
        data.partners = data.partners.filter(p => p.id !== partnerId);
        this.save(data);
    },

    /**
     * Get all partners
     */
    getPartners() {
        return this.load().partners;
    },

    /**
     * Get partner by ID
     */
    getPartner(partnerId) {
        const data = this.load();
        return data.partners.find(p => p.id === partnerId);
    },

    /**
     * Update partner's shared data (received from partner)
     */
    updatePartnerData(partnerId, sharedData) {
        const data = this.load();
        const partner = data.partners.find(p => p.id === partnerId);

        if (partner) {
            partner.lastUpdate = new Date().toISOString();
            partner.sharedExperiments = sharedData.experiments || [];
            partner.moodToday = sharedData.moodToday || null;
            this.save(data);
            return true;
        }

        return false;
    },

    /**
     * Generate shareable progress summary
     */
    generateShareableProgress(experiments) {
        const today = StreakCalculator.toDateString(new Date());

        const experimentSummaries = experiments
            .filter(exp => exp.status !== 'archived')
            .map(exp => {
                const todayEntry = exp.entries?.find(e => e.date === today);
                const streak = StreakCalculator.calculate(exp);

                return {
                    title: exp.title,
                    category: exp.category,
                    streak: streak,
                    todayStatus: todayEntry
                        ? (todayEntry.type || (todayEntry.isCompleted ? 'completed' : 'missed'))
                        : 'pending',
                    progress: Math.round(StreakCalculator.progress(exp) * 100)
                };
            });

        const moodToday = MoodTracker.getMoodForDate(today);

        return {
            generatedAt: new Date().toISOString(),
            date: today,
            experiments: experimentSummaries,
            moodToday: moodToday ? {
                mood: moodToday.mood,
                energy: moodToday.energy
            } : null,
            stats: {
                totalExperiments: experimentSummaries.length,
                completedToday: experimentSummaries.filter(e => e.todayStatus === 'completed' || e.todayStatus === 'minimum').length,
                pendingToday: experimentSummaries.filter(e => e.todayStatus === 'pending').length
            }
        };
    },

    /**
     * Generate share text for copy/paste
     */
    generateShareText(experiments) {
        const progress = this.generateShareableProgress(experiments);
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        let text = `📊 My Experiments Progress - ${today}\n\n`;

        progress.experiments.forEach(exp => {
            const statusEmoji = exp.todayStatus === 'completed' ? '✅' :
                exp.todayStatus === 'minimum' ? '☑️' :
                    exp.todayStatus === 'pending' ? '⏳' : '❌';
            text += `${statusEmoji} ${exp.title} - ${exp.streak} day streak (${exp.progress}%)\n`;
        });

        if (progress.moodToday) {
            const moodEmoji = MoodTracker.getMoodEmoji(progress.moodToday.mood);
            const energyEmoji = MoodTracker.getEnergyEmoji(progress.moodToday.energy);
            text += `\n${moodEmoji} Mood | ${energyEmoji} Energy`;
        }

        text += `\n\n🔗 Share code: ${this.getMyShareCode()}`;

        return text;
    },

    /**
     * Generate QR code data (JSON for partner to scan)
     */
    generateQRData(experiments) {
        const progress = this.generateShareableProgress(experiments);
        return JSON.stringify({
            type: 'experiments_share',
            shareCode: this.getMyShareCode(),
            data: progress
        });
    },

    /**
     * Parse received share data
     */
    parseShareData(dataString) {
        try {
            const parsed = JSON.parse(dataString);
            if (parsed.type !== 'experiments_share') {
                return { success: false, error: 'Invalid share data format' };
            }
            return { success: true, data: parsed };
        } catch (e) {
            return { success: false, error: 'Could not parse share data' };
        }
    },

    /**
     * Get partner status summary
     */
    getPartnerStatus(partner) {
        if (!partner.lastUpdate) {
            return {
                status: 'no_data',
                message: 'No updates received yet',
                emoji: '❓'
            };
        }

        const lastUpdate = new Date(partner.lastUpdate);
        const hoursAgo = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60));

        if (hoursAgo > 48) {
            return {
                status: 'stale',
                message: `Last update ${Math.floor(hoursAgo / 24)} days ago`,
                emoji: '😴'
            };
        }

        const completed = partner.sharedExperiments?.filter(e =>
            e.todayStatus === 'completed' || e.todayStatus === 'minimum'
        ).length || 0;
        const total = partner.sharedExperiments?.length || 0;

        if (completed === total && total > 0) {
            return {
                status: 'all_done',
                message: 'All experiments done today!',
                emoji: '🌟'
            };
        } else if (completed > 0) {
            return {
                status: 'in_progress',
                message: `${completed}/${total} done today`,
                emoji: '💪'
            };
        } else {
            return {
                status: 'not_started',
                message: 'No check-ins today yet',
                emoji: '⏰'
            };
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PartnersManager;
}
