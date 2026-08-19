# 🛑 High-Stakes Change Protocol (SOP)

## 🎯 Intent
To ensure zero data loss and 100% uptime during critical updates to *Experiments Web* and other PWA applications. This protocol **MUST** be followed when modifying core systems.

## ⚠️ What is a "High-Stakes" Change?
If your change touches any of the following, strictly follow this SOP:
1.  **Service Worker (`sw.js`)**: Caching logic, install events, fetch interception.
2.  **Data Schema (`js/data.js`)**: Changing `localStorage` keys, object structure, or migration logic.
3.  **Core Logic (`js/app.js`)**: State management, routing, or initialization.
4.  **Dependencies**: Adding external scripts or large assets.

---

## 1. 📝 Phase 1: The RFC Plan
**Before writing code**, you must create/update `implementation_plan.md` with these specific sections:

### A. Data Migration Strategy
*   *Question:* Will old `localStorage` data break the new code?
*   *Requirement:* If yes, write a migration function in `App.init()`.

### B. The Fallback Plan
*   *Question:* If this bricks the app, how do users recover?
*   *Requirement:* Verify the "Kill Switch" (see below) is accessible.

---

## 2. 🧪 Phase 2: "Pre-Flight" Simulation
You cannot just "refresh" to test. You must simulate a fresh user and an updating user.

### Protocol A: The "clean Slate" (New User)
1.  Open Chrome **Incognito Window**.
2.  Navigate to the local app (e.g., `http://127.0.0.1:5500`).
3.  Open DevTools -> Application -> **Service Workers**.
4.  Verify: Status is `Activated`.
5.  Verify: No console errors on load.
6.  **Action**: Create 1 item (Experiment/Task). Reload. Verify persistence.

### Protocol B: The "Upgrade" (Existing User)
1.  Open a **Normal Window** (where the *old* version is likely cached).
2.  Make your code change.
3.  **CRITICAL**: Increment `CACHE_VERSION` in `sw.js` (e.g., `v1.1.0` -> `v1.1.1`).
4.  Reload the page.
5.  **Verify**: "Update Available" toast appears (if implemented) OR Service Worker status changes to `installing` -> `waiting` -> `active` (after skipWaiting).
6.  **Action**: Verify old data is still there and valid.

---

## 3. 🚀 Phase 3: The Deployment Gate
Before `git push`:

1.  **✅ Audit `sw.js`**: Did you increment the version?
2.  **✅ Test Runner**: Run `tests/test-runner.html`. All Green?
3.  **✅ Syntax Check**: No `console.log` or `debugger` statements in production code.

---

## 4. 🧨 Appendix: The Kill Switch
If a bad Service Worker is deployed and users are stuck (e.g., white screen loop), deploy this `sw.js` immediately to flush their cache:

```javascript
// EMERGENCY RESET SERVICE WORKER
const CACHE_KEY = 'EMERGENCY_RESET_v1';

self.addEventListener('install', event => {
    self.skipWaiting(); // Force activation
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            // DELETE EVERYTHING
            return Promise.all(keys.map(key => caches.delete(key)));
        }).then(() => {
            return self.clients.claim(); // Take control immediately
        })
    );
});
```

---

## 5. 🔄 "Sync & Merge" Safety
(When pulling changes from GitHub/LLMs)

If you pull code that touches `sw.js`, `data.js`, or critical parameters:
1.  **Assume it is broken.**
2.  **Increment `CACHE_VERSION`** immediately if the remote didn't.
3.  **Run Phase 2 (Protocol B)**: Verify the "Update Available" flow works locally before you do *any* further work.

---

## 6. 🔍 Phase 4: Functional Regression Checklist
**"Did I break something else?"** Run this 60-second check before every commit:

### 1. The "Neighbor" Test
*   *Principle:* Bugs often appear in components *adjacent* to your change.
*   **Check:** If you changed "Todo", test "Experiments". If you changed "Swipe", test "Click".

### 2. The "Zero" Test
*   *Principle:* Most bugs live in empty states.
*   **Check:** What happens if the list is empty? If the input is null? If custom data is missing?

### 3. The "Chaos" Test
*   *Principle:* Users don't wait for animations to finish.
*   **Check:** 
    *   Swipe left/right rapidly.
    *   Tap multiple buttons at once.
    *   Reload while an action is performing.
    *   Disconnect network (Offline Mode) and try to save.

---

## 7. 🏷️ Code Review & Sign-Off
*   **Self-Review**: Read your diffs. If you don't understand a line, delete it.
*   **Agent Review**: Ask the AI: *"Analyze this diff for potential regressions in [related-feature]."*

