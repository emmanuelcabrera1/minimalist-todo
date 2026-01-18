/**
 * Life Compass - Life Events Management
 * ============================================
 * Add and manage life events.
 */

const LifeEvents = {
    async add(timestamp = null) {
        const defaultDate = timestamp ? new Date(timestamp) : new Date();

        const content = `
            <form id="event-form" onsubmit="LifeEvents.save(event)">
                <div class="form-group">
                    <label class="form-label">Event Title</label>
                    <input type="text" class="form-input" name="title" placeholder="Graduation, Wedding, etc." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" name="date" value="${defaultDate.toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Emoji</label>
                    <input type="text" class="form-input" name="emoji" value="✦" maxlength="2">
                </div>
                <div class="form-group">
                    <label class="form-label">Reflection (optional)</label>
                    <textarea class="form-input form-textarea" name="reflection" rows="2" placeholder="What did this moment mean to you?"></textarea>
                </div>
            </form>
        `;
        const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button type="submit" form="event-form" class="btn btn-primary" style="background:var(--accent-life)">Add Event</button>`;
        await Modal.show({ title: 'Add Life Event', content, footer, type: 'full' });
    },

    async save(event) {
        event.preventDefault();
        const fd = new FormData(event.target);
        await LifeRepo.createEvent({
            title: fd.get('title'),
            date: new Date(fd.get('date')).toISOString(),
            emoji: fd.get('emoji') || '✦',
            reflection: fd.get('reflection') || null
        });
        Modal.close();
        Toast.success('Event added!');
        Navigation.renderModule('life');
    }
};

window.LifeEvents = LifeEvents;
