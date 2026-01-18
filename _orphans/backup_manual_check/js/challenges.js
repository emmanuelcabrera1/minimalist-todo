/**
 * Experiments - Challenge Mode
 * Compete on consistency with accountability partners
 */

const CHALLENGES_KEY = 'experiments_challenges';

const ChallengesManager = {
    /**
     * Scoring system
     */
    SCORING: {
        completed: 10,
        minimum: 5,
        skipped: 0,
        missed: -2
    },

    /**
     * Load challenges
     */
    load() {
        try {
            return JSON.parse(localStorage.getItem(CHALLENGES_KEY) || '[]');
        } catch (e) {
            console.error('Failed to load challenges:', e);
            return [];
        }
    },

    /**
     * Save challenges
     */
    save(challenges) {
        localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    },

    /**
     * Create new challenge
     */
    createChallenge(templateId, name, startDate, durationDays, participants = []) {
        const challenges = this.load();

        const challenge = {
            id: 'challenge_' + Date.now(),
            name: name,
            templateId: templateId,
            startDate: startDate || StreakCalculator.toDateString(new Date()),
            durationDays: durationDays,
            endDate: this.calculateEndDate(startDate, durationDays),
            participants: [
                { id: 'local', name: 'You', score: 0, entries: [] },
                ...participants.map(p => ({ ...p, score: 0, entries: [] }))
            ],
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        challenges.push(challenge);
        this.save(challenges);

        return challenge;
    },

    /**
     * Calculate end date
     */
    calculateEndDate(startDate, durationDays) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + durationDays);
        return StreakCalculator.toDateString(start);
    },

    /**
     * Get all challenges
     */
    getChallenges() {
        return this.load();
    },

    /**
     * Get active challenges
     */
    getActiveChallenges() {
        const today = StreakCalculator.toDateString(new Date());
        return this.load().filter(c =>
            c.status === 'active' && c.endDate >= today
        );
    },

    /**
     * Get challenge by ID
     */
    getChallenge(challengeId) {
        return this.load().find(c => c.id === challengeId);
    },

    /**
     * Record entry for challenge
     */
    recordEntry(challengeId, participantId, date, entryType) {
        const challenges = this.load();
        const challenge = challenges.find(c => c.id === challengeId);

        if (!challenge) return null;

        const participant = challenge.participants.find(p => p.id === participantId);
        if (!participant) return null;

        // Remove existing entry for this date
        participant.entries = participant.entries.filter(e => e.date !== date);

        // Add new entry
        const points = this.SCORING[entryType] || 0;
        participant.entries.push({
            date: date,
            type: entryType,
            points: points,
            recordedAt: new Date().toISOString()
        });

        // Recalculate score
        participant.score = participant.entries.reduce((sum, e) => sum + e.points, 0);

        this.save(challenges);
        return challenge;
    },

    /**
     * Sync local experiment entries to challenge
     */
    syncLocalEntries(challengeId, experiment) {
        const challenges = this.load();
        const challenge = challenges.find(c => c.id === challengeId);

        if (!challenge || !experiment.entries) return null;

        const participant = challenge.participants.find(p => p.id === 'local');
        if (!participant) return null;

        // Sync entries within challenge date range
        const startDate = new Date(challenge.startDate);
        const endDate = new Date(challenge.endDate);

        experiment.entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            if (entryDate >= startDate && entryDate <= endDate) {
                const type = entry.type || (entry.isCompleted ? 'completed' : 'missed');
                this.recordEntry(challengeId, 'local', entry.date, type);
            }
        });

        return this.getChallenge(challengeId);
    },

    /**
     * Update partner entries in challenge
     */
    updatePartnerEntries(challengeId, partnerId, entries) {
        const challenges = this.load();
        const challenge = challenges.find(c => c.id === challengeId);

        if (!challenge) return null;

        const participant = challenge.participants.find(p => p.id === partnerId);
        if (!participant) return null;

        entries.forEach(entry => {
            this.recordEntry(challengeId, partnerId, entry.date, entry.type);
        });

        return this.getChallenge(challengeId);
    },

    /**
     * Get leaderboard for challenge
     */
    getLeaderboard(challengeId) {
        const challenge = this.getChallenge(challengeId);
        if (!challenge) return [];

        return [...challenge.participants]
            .sort((a, b) => b.score - a.score)
            .map((p, index) => ({
                ...p,
                rank: index + 1,
                completionRate: this.getCompletionRate(p, challenge),
                daysCompleted: p.entries.filter(e => e.type === 'completed' || e.type === 'minimum').length
            }));
    },

    /**
     * Calculate completion rate for participant
     */
    getCompletionRate(participant, challenge) {
        const today = new Date();
        const startDate = new Date(challenge.startDate);
        const daysPassed = Math.max(1, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));

        const completed = participant.entries.filter(e =>
            e.type === 'completed' || e.type === 'minimum'
        ).length;

        return Math.round((completed / daysPassed) * 100);
    },

    /**
     * Check if challenge is completed
     */
    isChallengeCompleted(challengeId) {
        const challenge = this.getChallenge(challengeId);
        if (!challenge) return false;

        const today = StreakCalculator.toDateString(new Date());
        return today > challenge.endDate;
    },

    /**
     * Get challenge winner
     */
    getWinner(challengeId) {
        const leaderboard = this.getLeaderboard(challengeId);
        if (leaderboard.length === 0) return null;

        const topScore = leaderboard[0].score;
        const winners = leaderboard.filter(p => p.score === topScore);

        return winners.length === 1
            ? { type: 'winner', participants: winners }
            : { type: 'tie', participants: winners };
    },

    /**
     * Archive completed challenge
     */
    archiveChallenge(challengeId) {
        const challenges = this.load();
        const challenge = challenges.find(c => c.id === challengeId);

        if (challenge) {
            challenge.status = 'completed';
            challenge.completedAt = new Date().toISOString();
            challenge.winner = this.getWinner(challengeId);
            this.save(challenges);
        }

        return challenge;
    },

    /**
     * Get challenge progress summary
     */
    getProgressSummary(challengeId) {
        const challenge = this.getChallenge(challengeId);
        if (!challenge) return null;

        const today = new Date();
        const startDate = new Date(challenge.startDate);
        const endDate = new Date(challenge.endDate);

        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.min(totalDays, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, totalDays - daysPassed);

        return {
            challenge,
            totalDays,
            daysPassed,
            daysRemaining,
            percentComplete: Math.round((daysPassed / totalDays) * 100),
            leaderboard: this.getLeaderboard(challengeId),
            isCompleted: this.isChallengeCompleted(challengeId)
        };
    },

    /**
     * Invite partner to challenge
     */
    invitePartner(challengeId, partner) {
        const challenges = this.load();
        const challenge = challenges.find(c => c.id === challengeId);

        if (!challenge) return null;

        // Check if already participant
        if (challenge.participants.some(p => p.id === partner.id)) {
            return { success: false, error: 'Partner already in challenge' };
        }

        challenge.participants.push({
            id: partner.id,
            name: partner.name,
            score: 0,
            entries: [],
            invitedAt: new Date().toISOString()
        });

        this.save(challenges);
        return { success: true, challenge };
    },

    /**
     * Generate challenge invite text
     */
    generateInviteText(challengeId) {
        const challenge = this.getChallenge(challengeId);
        if (!challenge) return '';

        return `🏆 Join my ${challenge.name} challenge!\n\n` +
            `📅 ${challenge.durationDays} days starting ${challenge.startDate}\n` +
            `🎯 Template: ${challenge.templateId}\n\n` +
            `Challenge code: ${challengeId}\n\n` +
            `Let's hold each other accountable! 💪`;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChallengesManager;
}
