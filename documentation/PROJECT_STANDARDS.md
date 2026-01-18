# Project Standards (Zero-Entropy)

## Overview
All new projects in this workspace must adhere to the **Zero-Entropy** structure. This ensures consistency for both human developers and AI agents.

## Reference Implementation
👉 **[Experiments Web](../projects/experiments-web/README.md)** is the Gold Standard for structure and documentation.

## Required Structure
Every project must contain the following:

### 1. Root Files
- **`README.md`**: The project's intent and getting started guide.
- **`manifest.js`** (Optional): If utilizing dynamic manifests.

## ⚠️ Operational Protocols (CRITICAL)
For changes involving **Service Workers, Data Schema, or Core Logic**:
- You **MUST** follow the **[High-Stakes SOP](protocols/HIGH_STAKES_SOP.md)**.
- **NEVER** push without running the "Pre-Flight" simulation.


### 2. Documentation (`docs/`)
We use a **"Triad of Context"** model:
- **`docs/ARCHITECTURE.md`**: High-level system map, stack, and patterns.
- **`docs/AGENT_CONTEXT.md`**: Optimized cheat sheet for AI agents (file map, critical rules).
- **`docs/DEVELOPER_GUIDE.md`**: Step-by-step manual for common tasks (debugging, extending).

### 3. Testing (`tests/`)
- Must contain diagnostic tools or automated tests.
- Example: `tests/debug-diagnostic.html`.

### 4. Code Organization
- **Modular JS**: Split logic into `data.js`, `ui.js`, `app.js` (or similar).
- **No Monoliths**: Avoid single 2000+ line files without documentation.

## PWA Requirements
If the project is a Web App:
- Must have `manifest.json`.
- Must have `sw.js` (Service Worker) with cache versioning.
