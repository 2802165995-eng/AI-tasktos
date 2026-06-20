# Aliyun FC Deployment Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a tested Aliyun Function Compute Web Function deployment ZIP containing the TasteOS website and real-model API proxy without secrets or personal files.

**Architecture:** Refactor the existing Node HTTP server into importable configuration/server factories while preserving direct-script startup. Add an environment-driven host, a health endpoint, a whitelist packaging script, and a Chinese deployment guide; validate both runtime behavior and ZIP contents automatically.

**Tech Stack:** Node.js CommonJS/ES modules, native HTTP server, PowerShell, ZIP archive inspection, existing Node assertion tests.

---

### Task 1: FC-Compatible Server Configuration

**Files:**
- Modify: `scripts/static-server.js`
- Create: `scripts/static-server.test.mjs`

- [ ] Write a failing test that imports `getServerConfig` and `createTasteOsServer`, verifies defaults, environment overrides, and `GET /health`.
- [ ] Run `node scripts/static-server.test.mjs`; expect failure because the exports and health route do not exist.
- [ ] Refactor `static-server.js` to export `getServerConfig`, `createTasteOsServer`, and `startTasteOsServer`, use `HOST || 127.0.0.1`, and start only when `require.main === module`.
- [ ] Add `GET /health` returning `{"status":"ok"}` with JSON content type.
- [ ] Run the focused server test; expect exit code 0.
- [ ] Commit the server and test.

### Task 2: Whitelist Deployment Packaging

**Files:**
- Create: `scripts/package-aliyun-fc.ps1`
- Create: `scripts/aliyun-package.test.ps1`
- Modify: `.gitignore`

- [ ] Write a failing PowerShell test that runs the missing packaging script and checks required and forbidden ZIP entries.
- [ ] Run the test; expect failure because `package-aliyun-fc.ps1` does not exist.
- [ ] Implement a whitelist copy into a temporary staging directory and compress it to `dist/tasteos-aliyun-fc.zip`.
- [ ] Add `dist/` to `.gitignore`.
- [ ] Run the focused package test; expect exit code 0 and a valid ZIP.
- [ ] Commit packaging files and ignore rule.

### Task 3: Deployment Documentation

**Files:**
- Create: `DEPLOY_ALIYUN_FC.md`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `scripts/aliyun-package.test.ps1`

- [ ] Extend the package test to require `DEPLOY_ALIYUN_FC.md` and verify it contains the startup command, host, port, health endpoint, and required environment variable names; run it and observe RED.
- [ ] Write the Chinese control-panel instructions, environment-variable table, verification steps, and troubleshooting guide.
- [ ] Add `HOST` and `PORT` deployment examples to `.env.example`.
- [ ] Add an Aliyun deployment link and packaging command to `README.md`.
- [ ] Run the package test; expect GREEN.
- [ ] Commit documentation.

### Task 4: End-to-End Verification and Artifact Delivery

**Files:**
- Generate: `dist/tasteos-aliyun-fc.zip`

- [ ] Run every `scripts/*.test.mjs`; expect all Node tests to pass.
- [ ] Run `scripts/aliyun-package.test.ps1`; expect all package assertions to pass.
- [ ] Start with `HOST=0.0.0.0 PORT=9000`, request `/health` and `/`, then stop the server.
- [ ] Run the packaging script again to create the final ZIP.
- [ ] Inspect ZIP entries and confirm `.env.local`, `.git`, tests, logs, docs, and personal files are absent.
- [ ] Report the absolute ZIP path and SHA-256 checksum.
