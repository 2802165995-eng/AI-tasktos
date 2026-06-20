# TasteOS Shareable Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TasteOS readable, shareable, and diagnosable as a local demo package.

**Architecture:** Keep the app as a zero-dependency static web app served by `scripts/static-server.js`. Repair UTF-8 Chinese copy in the UI and local analysis engine, improve the API error boundary, and document the exact local sharing workflow.

**Tech Stack:** Browser ES modules, Node.js built-in `http` server, localStorage, existing `.mjs` test scripts.

---

### Task 1: Baseline And Mojibake Detection

**Files:**
- Test: `scripts/text-integrity.test.mjs`
- Read: `index.html`
- Read: `src/app.js`
- Read: `src/tasteEngine.js`
- Read: `README.md`

- [ ] **Step 1: Write the failing test**

Create `scripts/text-integrity.test.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";

const files = ["README.md", "index.html", "src/app.js", "src/tasteEngine.js"];
const mojibakePatterns = [/涓/, /鎻/, /鐢/, /绂/, /妗/, /€\?/];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of mojibakePatterns) {
    assert.equal(pattern.test(text), false, `${file} contains mojibake pattern ${pattern}`);
  }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\text-integrity.test.mjs
```

Expected: FAIL because current Chinese strings contain mojibake.

- [ ] **Step 3: Repair Chinese copy**

Rewrite `README.md`, `index.html`, `src/app.js`, and `src/tasteEngine.js` with readable UTF-8 Chinese while preserving current app behavior and exports.

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\text-integrity.test.mjs
```

Expected: PASS.

### Task 2: API Diagnostics

**Files:**
- Modify: `scripts/openai-analysis.mjs`
- Modify: `src/apiClient.js`
- Test: `scripts/api-client.test.mjs`
- Test: `scripts/openai-analysis.test.mjs`

- [ ] **Step 1: Add failing tests**

Add tests that verify missing provider, missing API key, and missing model produce clear error messages such as `请在 .env.local 中配置 DASHSCOPE_API_KEY` or `请在 .env.local 中配置 OPENAI_MODEL`.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\api-client.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\openai-analysis.test.mjs
```

Expected: FAIL until diagnostics are implemented.

- [ ] **Step 3: Implement minimal diagnostics**

Normalize provider names in `scripts/openai-analysis.mjs`, validate required keys before remote calls, and preserve fallback behavior in `src/app.js` when `analyzeReferenceViaApi` throws.

- [ ] **Step 4: Run tests to verify they pass**

Run the same two test commands. Expected: PASS.

### Task 3: Product Experience Polish

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `scripts/text-integrity.test.mjs`

- [ ] **Step 1: Add failing text assertions**

Extend `scripts/text-integrity.test.mjs` to assert that `src/app.js` includes these user-facing strings:

```js
const appText = fs.readFileSync("src/app.js", "utf8");
assert.match(appText, /离线 Demo 分析/);
assert.match(appText, /真实模型分析/);
assert.match(appText, /已回退到离线 Demo 分析/);
assert.match(appText, /已复制/);
```

- [ ] **Step 2: Run test to verify it fails**

Run `scripts\text-integrity.test.mjs`. Expected: FAIL until the UI strings exist.

- [ ] **Step 3: Implement product copy and state feedback**

Update mode labels, upload empty state, analysis notices, copy success messages, and feedback empty states in `src/app.js`. Add only small CSS changes needed to keep notices readable.

- [ ] **Step 4: Run test to verify it passes**

Run `scripts\text-integrity.test.mjs`. Expected: PASS.

### Task 4: Documentation And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Rewrite README**

Document one-minute startup, how to zip and send the project, Demo mode, real API mode, DashScope/OpenAI examples, common errors, and test commands.

- [ ] **Step 2: Verify syntax and tests**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\app.js
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\taste-engine.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\reference-state.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\library-view-model.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\prompt-history.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\prompt-adapters.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\profile-export.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\api-client.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\openai-analysis.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\text-integrity.test.mjs
```

Expected: all commands pass.

- [ ] **Step 3: Manual browser smoke test**

Start:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\static-server.js
```

Open `http://127.0.0.1:4173/`, verify readable Chinese, upload form preview, offline analysis, prompt generation, and copy feedback.
