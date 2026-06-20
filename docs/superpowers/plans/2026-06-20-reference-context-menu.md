# Reference Context Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe right-click delete menu to reference cards and deploy it to GitHub Pages.

**Architecture:** Keep deletion in the existing state helper and add a small non-persistent context-menu state in `app.js`. Render one positioned menu at workbench level and centralize deletion through a confirmation-aware handler.

**Tech Stack:** Browser JavaScript, DOM contextmenu events, existing localStorage state, Node source-regression tests.

---

### Task 1: Context Menu UI and Events

- Add failing UI assertions for context-menu hooks.
- Render the positioned menu when a card is right-clicked.
- Bind delete, outside click, scroll and Escape close behavior.
- Reuse one confirmed deletion handler for both menu and existing delete entry.
- Add menu styles and verify focused tests.

### Task 2: Browser Verification and Deployment

- Run all tests.
- Start the local server and verify right-click opens the menu.
- Verify cancel leaves the count unchanged and confirm decreases it.
- Commit, push `main`, and wait until GitHub Pages serves the new hooks.
