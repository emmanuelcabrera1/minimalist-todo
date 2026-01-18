# Master UX/UI & Accessibility Audit Prompt

## PROMPT START

You are a senior UX engineer and accessibility specialist performing a thorough audit of the following web application. Your audit must identify **functional bugs**, **UX friction points**, **accessibility violations**, and **design inconsistencies**.

---

## PHASE 1: FUNCTIONAL TESTING (Critical - Find Bugs First)

### 1.1 Core User Flows
Test each primary user flow end-to-end:

- [ ] **Create Flow**: Can user create new items without errors?
- [ ] **Read Flow**: Are items displayed correctly after creation?
- [ ] **Update Flow**: Do edits persist and display correctly?
- [ ] **Delete Flow**: Is deletion confirmed and data removed?
- [ ] **Duplicate Detection**: Are there race conditions causing duplicates?

### 1.2 State Management
- [ ] Does data persist correctly to storage?
- [ ] Is state synchronized between views?
- [ ] Are there stale state issues after navigation?
- [ ] Is data reloaded correctly on re-render?

### 1.3 UI Controls
- [ ] Do all buttons trigger their intended actions?
- [ ] Are toggle/filter buttons functional?
- [ ] Do progress indicators update correctly?
- [ ] Are loading states shown during async operations?

### 1.4 Error Conditions
- [ ] Empty input submission handling
- [ ] Duplicate data handling
- [ ] Network failure recovery (if applicable)
- [ ] Edge cases (empty state, max limits, special characters)

### 1.5 Performance Issues
- [ ] Does the app freeze during any operation?
- [ ] Are there memory leaks (growing memory over time)?
- [ ] Is scrolling smooth or janky?
- [ ] Are there unresponsive periods?

---

## PHASE 2: UX AUDIT (User Experience Quality)

### 2.1 Information Architecture
- [ ] Is the navigation intuitive?
- [ ] Are labels clear and descriptive?
- [ ] Is content hierarchy logical?
- [ ] Can users find what they need in ≤3 taps?

### 2.2 Interaction Design
- [ ] Do interactive elements look interactive?
- [ ] Is feedback immediate on user actions?
- [ ] Are tap/click targets adequate (≥44px)?
- [ ] Do gestures work as expected?

### 2.3 Visual Feedback
- [ ] Is there feedback for every user action?
- [ ] Do success/error states display clearly?
- [ ] Are progress indicators accurate?
- [ ] Do animations convey meaning (not just decoration)?

### 2.4 Error Prevention & Recovery
- [ ] Are destructive actions confirmed?
- [ ] Can users undo mistakes?
- [ ] Are error messages actionable?
- [ ] Is validation inline (not just on submit)?

### 2.5 Cognitive Load
- [ ] Is the interface cluttered?
- [ ] Are there too many choices at once? (Hick's Law)
- [ ] Is important content above the fold?
- [ ] Are forms broken into digestible steps?

---

## PHASE 3: ACCESSIBILITY AUDIT (WCAG 2.1 AA)

### 3.1 Perceivable
- [ ] Color contrast ≥4.5:1 for normal text, ≥3:1 for large text
- [ ] Information not conveyed by color alone
- [ ] Text resizable to 200% without breaking layout
- [ ] Images have meaningful alt text
- [ ] Videos have captions (if applicable)

### 3.2 Operable
- [ ] All functionality reachable via keyboard
- [ ] Visible focus indicator on all interactive elements
- [ ] Logical tab order (left→right, top→bottom)
- [ ] No keyboard traps (can always tab away)
- [ ] Escape key closes modals/overlays
- [ ] No content that flashes >3 times per second

### 3.3 Understandable
- [ ] Page language declared (`<html lang="en">`)
- [ ] Labels associated with form inputs
- [ ] Error messages adjacent to fields
- [ ] Consistent navigation across pages
- [ ] Predictable behavior (no unexpected context changes)

### 3.4 Robust
- [ ] Valid HTML (no duplicate IDs, proper nesting)
- [ ] ARIA attributes used correctly
- [ ] Works across browsers (Chrome, Safari, Firefox)
- [ ] Assistive technology compatible (screen readers)

---

## PHASE 4: VISUAL DESIGN AUDIT

### 4.1 Design System Consistency
- [ ] Typography follows defined scale
- [ ] Colors match design tokens
- [ ] Spacing uses consistent grid
- [ ] Components look unified

### 4.2 Responsive Behavior
- [ ] No horizontal scroll on mobile
- [ ] Touch targets properly sized
- [ ] Safe area insets respected
- [ ] Content reflows at breakpoints

### 4.3 Visual Polish
- [ ] Alignment is pixel-perfect
- [ ] Shadows/borders are consistent
- [ ] Icons are appropriately sized
- [ ] No visual glitches or artifacts

---

## OUTPUT FORMAT

### Bug Report Table
| ID | Severity | Category | Location | Description | Steps to Reproduce | Expected | Actual |
|----|----------|----------|----------|-------------|-------------------|----------|--------|
| B1 | 🔴 Critical | Functional | file:line | ... | 1. 2. 3. | ... | ... |

### UX Issue Table  
| ID | Impact | Category | Location | Issue | Recommendation |
|----|--------|----------|----------|-------|----------------|
| U1 | High | Interaction | screen | ... | ... |

### Accessibility Issue Table
| ID | WCAG | Severity | Element | Issue | Fix |
|----|------|----------|---------|-------|-----|
| A1 | 1.4.3 | 🔴 | button | ... | ... |

**Severity Legend**:
- 🔴 **Critical**: App-breaking bug, crash, data loss, or WCAG A violation
- 🟡 **Major**: Feature broken, significant UX friction, or WCAG AA violation  
- 🟢 **Minor**: Polish issue, edge case, or best practice

---

## FINAL DELIVERABLES

1. **Executive Summary**: Overall assessment in 3-5 sentences
2. **Critical Bugs**: All 🔴 issues requiring immediate fix
3. **UX Friction Points**: Prioritized list of user experience issues
4. **Accessibility Violations**: WCAG checklist with pass/fail
5. **Recommended Fix Order**: Prioritized implementation roadmap
