# TasteOS Workbench Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing TasteOS page into the approved production-scale PC workbench without removing any existing module or upload capability.

**Architecture:** Preserve the current vanilla JavaScript rendering and state flow. Add structural class hooks only where CSS cannot express the approved hierarchy, then replace the accumulated visual overrides with one canonical desktop layout layer driven by TasteOS tokens.

**Tech Stack:** HTML, CSS, vanilla ES modules, Node.js assertion tests.

---

### Task 1: Lock the desktop contract with regression tests

**Files:**
- Modify: `scripts/ui-regression.test.mjs`

- [ ] Add assertions for the 56px header, 72px workflow rail, 320px side panels, visible upload controls, five navigation modules, focus-visible styles, and reduced-motion handling.
- [ ] Run `node scripts/ui-regression.test.mjs`.
- [ ] Confirm the new assertions fail because the canonical reset layer does not exist yet.

### Task 2: Implement the canonical TasteOS shell

**Files:**
- Modify: `src/styles.css`
- Modify only if needed: `src/app.js`
- Modify: `index.html`

- [ ] Add the approved font declarations and semantic TasteOS tokens.
- [ ] Implement the fixed 56px header, 72px rail, 320px library, flexible analysis area, and 320px configuration panel.
- [ ] Keep the configuration panel visible at 1280px and preserve a 600px minimum analysis canvas.
- [ ] Restyle cards, forms, upload preview, states, navigation, prompt output, profile, feedback, and about views using the same token system.
- [ ] Add visible keyboard focus and reduced-motion rules.

### Task 3: Verify behavior and visual output

**Files:**
- Test: `scripts/*.test.mjs`

- [ ] Run `node scripts/ui-regression.test.mjs` and confirm PASS.
- [ ] Run every `scripts/*.test.mjs` test except network-dependent/manual analysis scripts and confirm PASS.
- [ ] Start `node scripts/static-server.js`.
- [ ] Inspect the page at 1440×900 and 1280×800.
- [ ] Verify five modules, local upload, URL input, analysis mode, and start-analysis control are visible and enabled.
