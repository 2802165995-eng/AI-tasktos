# Shareable GitHub Pages and FC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GitHub Pages call the Aliyun FC model API reliably, support cancellation, and accept pasted clipboard images.

**Architecture:** Configure the frontend API base URL through HTML metadata, add strict CORS preflight handling to the FC server, and isolate pasted-image validation/read logic in a testable module. Preserve local same-origin behavior through API-client fallbacks and produce an updated FC ZIP.

**Tech Stack:** Browser ES modules, Fetch/AbortController, ClipboardEvent/FileReader APIs, Node HTTP server, Node assertion tests, PowerShell ZIP packaging.

---

### Task 1: Configurable Frontend API Endpoint

- Test `resolveAnalyzeReferenceUrl` for option override, meta configuration, and same-origin fallback.
- Implement URL normalization and use it in `analyzeReferenceViaApi`.
- Add the FC base URL meta element to `index.html`.
- Verify API client tests and commit.

### Task 2: FC CORS and Preflight

- Extend server tests for allowed preflight, allowed POST headers, rejected foreign origin, and no-Origin diagnostics.
- Implement `ALLOWED_ORIGIN`, `OPTIONS` response, `Vary: Origin`, and 403 rejection.
- Update `.env.example` and deployment guide.
- Verify server tests and commit.

### Task 3: Clipboard Image Paste

- Create tests for finding the first image clipboard item and validating MIME type/size.
- Implement `src/imageInput.js` with a 3 MB maximum and JPEG/PNG/WebP support.
- Bind a document paste handler that reads the image, stores its data URL as the pending image, updates preview text, and uses it on submit.
- Preserve cancel behavior and clear pasted state after successful submission/reset.
- Add UI regression assertions and commit.

### Task 4: Verification and Deployment Artifacts

- Run all Node and package tests.
- Simulate CORS preflight from `https://2802165995-eng.github.io`.
- Verify local paste/cancel behavior in a browser.
- Generate the final `dist/tasteos-aliyun-fc.zip`.
- Merge to `main`, rerun tests, push `main` to GitHub.
- Verify GitHub Pages contains the FC meta configuration.
- Deliver the new ZIP for FC console upload and list the required `ALLOWED_ORIGIN`.
