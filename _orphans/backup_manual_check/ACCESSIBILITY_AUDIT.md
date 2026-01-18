# Comprehensive UX/UI & Accessibility Audit Report

**Date:** January 10, 2026
**Auditor:** Claude (AI Senior UX Engineer & Accessibility Expert)
**Scope:** Experiments PWA - `/projects/experiments-web/`

---

## Target Application

| Property | Value |
|----------|-------|
| **Name** | Experiments (Life Experiments Tracker) |
| **Path** | `/home/user/experiments-app/projects/experiments-web/` |
| **Description** | PWA for tracking personal life experiments with check-in system |
| **Type** | Progressive Web App (PWA) |
| **Target Device** | iPhone 15/16/17 Pro (393x852 pt, @3x, ProMotion 120Hz) |
| **Primary Browser** | Safari iOS / Chrome iOS |
| **Technology Stack** | Vanilla JavaScript, CSS3 (Custom Properties), HTML5 |

---

## Executive Summary

The Experiments PWA demonstrates a **solid foundation** with thoughtful implementation of iOS design patterns, a clean monochrome aesthetic, and good accessibility groundwork. The codebase shows evidence of prior accessibility work (contrast fixes, focus indicators, ARIA implementation).

### Strengths
- Well-structured vanilla JS architecture with clear separation of concerns
- XSS protection via `escapeHtml()` function
- Good ARIA implementation for modals and navigation
- Respects `prefers-color-scheme` for dark mode
- Service worker with proper caching strategy
- Safe area handling for iOS

### Issue Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| Major | 8 |
| Minor | 12 |

**Production Readiness:** Requires fixes before release - Several accessibility and functional issues need addressing.

---

## Critical Issues (Immediate Fix Required)

### [A2] Dark Mode Tertiary Text Contrast
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Severity:** Critical
- **File:** `css/tokens.css:81-82`
- **Issue:** `--text-tertiary: #EBEBF54D` (30% white) on `#1C1C1E` has ~1.8:1 contrast ratio
- **Impact:** Text is essentially invisible to users with low vision
- **Fix:** Change to `--text-tertiary: #EBEBF580;` (50% white, ~2.6:1)

### [A9] Invalid HTML Structure
- **WCAG:** 4.1.1 Parsing
- **Severity:** Critical
- **File:** `js/app.js:425-426`
- **Issue:** Extra closing `</div>` tag in check-in modal creates invalid HTML
- **Impact:** DOM structure unpredictable, may break assistive technologies
- **Fix:** Remove extra `</div>` at line 426

### [I3] No Reduced Motion Support
- **WCAG:** 2.3.3 Animation from Interactions
- **Severity:** Critical
- **File:** `css/components.css`
- **Issue:** No `prefers-reduced-motion` media query implemented
- **Impact:** Users with vestibular disorders may experience discomfort
- **Fix:** Add media query:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Major Issues (Fix Before Release)

### [B2] No App Resume Handler
- **Category:** State Management
- **File:** `js/app.js`
- **Issue:** No `visibilitychange` event listener to refresh data when app resumes
- **Fix:** Add `document.addEventListener('visibilitychange', handler)`

### [B4] Silent Data Loss on Corruption
- **Category:** Error Handling
- **File:** `js/data.js:80-89`
- **Issue:** localStorage parse errors silently return empty data
- **Fix:** Add error notification and backup restoration attempt

### [U4] No Undo for Delete Actions
- **Category:** UX
- **Issue:** Deleted experiments cannot be recovered despite confirmation dialog
- **Fix:** Implement soft-delete with timed undo option

### [U5] Missing Form Input Attributes
- **Category:** Mobile UX
- **File:** `js/app.js:342-378`
- **Issue:** Missing `inputmode` and `autocomplete` attributes on form inputs
- **Fix:** Add `inputmode="numeric"` to duration, `inputmode="text"` to text fields

### [A1] Dark Mode Secondary Text Contrast
- **WCAG:** 1.4.3 Contrast
- **File:** `css/tokens.css:79`
- **Issue:** `#EBEBF599` (60% white) on `#1C1C1E` has ~3.4:1 contrast (requires 4.5:1)
- **Fix:** Increase to `--text-secondary: #EBEBF5CC;` (80% white)

### [A11] Clickable Divs Not Keyboard Accessible
- **WCAG:** 2.1.1 Keyboard
- **Files:** `js/ui.js:82-147`
- **Issue:** Experiment rows, template cards are clickable `<div>` without proper ARIA
- **Fix:** Add `role="button" tabindex="0"` and keyboard event handlers

### [I1] Touch Targets Below 44pt Minimum
- **Apple HIG:** Touch Targets
- **Locations:**
  - Calendar nav buttons: 32x32px
  - Modal close button: 32x32px
  - Back/Edit buttons: 40x40px
- **Fix:** Increase all to minimum 44x44px

### [V3] Hardcoded Colors Break Dark Mode
- **Category:** Visual Design
- **File:** `js/app.js:247,278,284`
- **Issue:** Settings icon backgrounds use hardcoded colors
- **Fix:** Use CSS custom properties that adapt to theme

---

## Minor Issues (Polish Items)

| ID | Category | Description | Location |
|----|----------|-------------|----------|
| B1 | Validation | No duplicate experiment title prevention | `js/data.js` |
| B3 | iOS | Back/Edit buttons 40px (should be 44px) | `js/app.js:141-145` |
| B5 | Form | No custom validation messages | `js/app.js:342-350` |
| U1 | UX | Calendar nav buttons too small (32px) | `css/components.css:572` |
| U2 | UX | Template cards missing :active state | `css/components.css` |
| U3 | UX | No loading indicator during updates | `js/app.js:948` |
| A3 | A11y | Icons need aria-hidden when paired with text | `js/ui.js:22-35` |
| A6 | A11y | Filter pills need focus-visible style | `css/components.css:149` |
| A8 | A11y | Segmented controls need aria-pressed | `js/app.js:352-365` |
| A10 | A11y | Experiment rows need role="button" | `js/ui.js:82-91` |
| V1 | Visual | Settings toggle alignment | `js/app.js:258-262` |
| V2 | Visual | Toast uses undefined --shadow-lg | `css/components.css:775` |
| I2 | iOS | Deprecated -webkit-overflow-scrolling | `css/components.css:146` |
| I4 | iOS | No visualViewport keyboard handling | Modal forms |
| P1 | PWA | Version mismatch (manifest 1.0.0 vs SW 1.0.6) | Multiple files |
| P2 | PWA | Apple touch icon should be 180px | `index.html:23` |
| P3 | PWA | No Apple splash screens | `index.html` |
| P4 | PWA | No offline indicator | App-wide |

---

## Accessibility Scorecard

| Category | Pass | Fail | N/A |
|----------|------|------|-----|
| **Perceivable** | 4 | 2 | 0 |
| **Operable** | 4 | 1 | 0 |
| **Understandable** | 3 | 1 | 0 |
| **Robust** | 2 | 2 | 0 |
| **iOS/VoiceOver** | 2 | 1 | 0 |
| **Motion** | 0 | 1 | 0 |
| **TOTAL** | **15** | **8** | 0 |

---

## Recommended Fix Order

### Priority 1: Critical Fixes (Day 1)
1. Fix extra `</div>` in check-in modal (`js/app.js:426`)
2. Add `prefers-reduced-motion` media query (`css/components.css`)
3. Fix dark mode tertiary text contrast (`css/tokens.css:81`)

### Priority 2: Accessibility & iOS (Day 2-3)
4. Make clickable divs keyboard accessible with role="button" tabindex="0"
5. Increase touch targets to 44x44px minimum
6. Fix dark mode secondary text contrast
7. Add focus-visible styles to filter pills

### Priority 3: Robustness (Day 4)
8. Add visibilitychange event handler
9. Add error recovery for corrupted localStorage
10. Add inputmode/autocomplete to form inputs

### Priority 4: Polish (Day 5+)
11. Fix hardcoded colors in settings icons for dark mode
12. Add undo functionality for delete actions
13. Sync version numbers across manifest and service worker
14. Add Apple splash screens

---

## Positive Observations

1. **XSS Protection**: Excellent use of `escapeHtml()` function for all user-generated content
2. **Focus Management**: Well-implemented focus trapping in modals with escape key support
3. **ARIA Implementation**: Good use of `role="tablist"`, `aria-label`, `aria-live` regions
4. **Dark Mode**: Comprehensive theme switching with proper CSS custom properties
5. **Service Worker**: Robust caching strategy with version-based invalidation
6. **Safe Areas**: Correct implementation of iOS safe area insets
7. **Typography System**: Well-organized type scale following 8pt grid
8. **State Management**: Clean separation of data layer from UI
9. **Content Security Policy**: Strict CSP implementation
10. **Toast Notifications**: Accessible toast system with proper ARIA attributes

---

## Testing Tools Recommended

- **Accessibility**: axe DevTools, WAVE, VoiceOver (iOS)
- **Contrast**: WebAIM Contrast Checker
- **Performance**: Lighthouse, WebPageTest
- **iOS Testing**: Safari Web Inspector, Xcode Simulator

---

## Appendix: WCAG 2.1 AA Checklist

### Level A (Must Pass)
- [x] 1.1.1 Non-text Content
- [x] 1.3.1 Info and Relationships
- [x] 1.3.2 Meaningful Sequence
- [x] 1.4.1 Use of Color
- [x] 2.1.1 Keyboard (Partial - needs role="button")
- [x] 2.1.2 No Keyboard Trap
- [x] 2.4.1 Bypass Blocks
- [x] 2.4.2 Page Titled
- [ ] 4.1.1 Parsing (Extra div tag)
- [x] 4.1.2 Name, Role, Value

### Level AA (Should Pass)
- [ ] 1.4.3 Contrast Minimum (Dark mode issues)
- [x] 1.4.4 Resize Text
- [x] 1.4.5 Images of Text
- [x] 2.4.5 Multiple Ways
- [x] 2.4.6 Headings and Labels
- [x] 2.4.7 Focus Visible
- [x] 3.1.1 Language of Page
- [x] 3.2.3 Consistent Navigation
- [x] 3.2.4 Consistent Identification
- [x] 3.3.3 Error Suggestion
