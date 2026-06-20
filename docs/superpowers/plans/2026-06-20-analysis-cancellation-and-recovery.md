# Analysis Cancellation and Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure image analysis can be cancelled and always recovers from request failure, timeout, cancellation, or page refresh.

**Architecture:** Add abort and timeout support at the API-client boundary, then manage one non-persistent analysis task in the UI using an `AbortController` and task identity. Extract the task-state rules into a small module so cancellation, stale-result protection, and startup recovery are directly testable without a browser.

**Tech Stack:** Browser JavaScript ES modules, Fetch API, AbortController, Node.js assertion tests, existing zero-dependency static app.

---

## File Structure

- Create `src/analysisTask.js`: pure helpers for creating, cancelling, matching, and recovering analysis task state.
- Create `scripts/analysis-task.test.mjs`: direct tests for task cancellation, stale-task rejection, and persisted-state recovery.
- Modify `src/apiClient.js`: propagate external cancellation and enforce a request timeout.
- Modify `scripts/api-client.test.mjs`: test signal propagation, cancellation, and timeout errors.
- Modify `src/app.js`: render and bind the cancel button, manage the active task, and use unified cleanup.
- Modify `src/styles.css`: lay out the analyze/cancel controls.
- Modify `scripts/ui-regression.test.mjs`: ensure cancellation UI hooks and recovery wiring remain present.

### Task 1: API Cancellation and Timeout

**Files:**
- Modify: `src/apiClient.js`
- Test: `scripts/api-client.test.mjs`

- [ ] **Step 1: Write failing API-client tests**

Add tests that assert the supplied signal reaches `fetch`, aborting rejects with an `AbortError`, and a short timeout rejects with `模型分析超时，请重试。`.

```js
const controller = new AbortController();
let receivedSignal;
const pendingRequest = analyzeReferenceViaApi(reference, {
  signal: controller.signal,
  timeoutMs: 1000,
  fetchImpl: async (_url, options) => {
    receivedSignal = options.signal;
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    });
  }
});
controller.abort(new DOMException("用户取消分析", "AbortError"));
await assert.rejects(pendingRequest, (error) => error.name === "AbortError");
assert.ok(receivedSignal.aborted);

await assert.rejects(
  analyzeReferenceViaApi(reference, {
    timeoutMs: 5,
    fetchImpl: async (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
      })
  }),
  /模型分析超时，请重试/
);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\api-client.test.mjs
```

Expected: FAIL because `options.signal` is not passed to `fetch` and timeout behavior does not exist.

- [ ] **Step 3: Implement signal composition and timeout**

Add an internal timeout controller, forward an external abort into it, pass the internal signal to `fetch`, translate only the internally generated timeout into the Chinese timeout error, and remove listeners/clear the timer in `finally`.

```js
const DEFAULT_ANALYSIS_TIMEOUT_MS = 45_000;

export async function analyzeReferenceViaApi(reference, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_ANALYSIS_TIMEOUT_MS;
  const controller = new AbortController();
  let didTimeout = false;
  const forwardAbort = () =>
    controller.abort(options.signal.reason || new DOMException("用户取消分析", "AbortError"));
  options.signal?.addEventListener("abort", forwardAbort, { once: true });
  if (options.signal?.aborted) forwardAbort();
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort(new DOMException("模型分析超时", "TimeoutError"));
  }, timeoutMs);

  try {
    // existing fetch and response validation, with signal: controller.signal
  } catch (error) {
    if (didTimeout) throw new Error("模型分析超时，请重试。");
    throw error;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}
```

- [ ] **Step 4: Run the API-client test and verify GREEN**

Run the command from Step 2.

Expected: exit code 0.

- [ ] **Step 5: Commit**

```powershell
git add src/apiClient.js scripts/api-client.test.mjs
git commit -m "fix: add analysis request cancellation and timeout"
```

### Task 2: Testable Analysis Task State

**Files:**
- Create: `src/analysisTask.js`
- Create: `scripts/analysis-task.test.mjs`

- [ ] **Step 1: Write failing task-state tests**

```js
import assert from "node:assert/strict";
import {
  cancelAnalysisTask,
  createAnalysisTask,
  isCurrentAnalysisTask,
  recoverAnalysisState
} from "../src/analysisTask.js";

const task = createAnalysisTask("task-1");
assert.equal(task.id, "task-1");
assert.equal(task.cancelled, false);
assert.equal(isCurrentAnalysisTask(task, task), true);

cancelAnalysisTask(task);
assert.equal(task.cancelled, true);
assert.equal(task.controller.signal.aborted, true);
assert.equal(isCurrentAnalysisTask(task, task), false);
assert.equal(isCurrentAnalysisTask({ id: "task-2" }, task), false);

assert.deepEqual(
  recoverAnalysisState({ isAnalyzing: true, analysisNotice: "正在分析" }),
  { isAnalyzing: false, analysisNotice: "上次分析已中断，请重新提交。" }
);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\analysis-task.test.mjs
```

Expected: FAIL with module-not-found for `src/analysisTask.js`.

- [ ] **Step 3: Implement the task-state helpers**

```js
export function createAnalysisTask(id = `analysis-task-${Date.now()}`) {
  return { id, controller: new AbortController(), cancelled: false };
}

export function cancelAnalysisTask(task) {
  if (!task || task.cancelled) return;
  task.cancelled = true;
  task.controller.abort(new DOMException("用户取消分析", "AbortError"));
}

export function isCurrentAnalysisTask(currentTask, candidateTask) {
  return Boolean(
    currentTask &&
      candidateTask &&
      currentTask.id === candidateTask.id &&
      !candidateTask.cancelled
  );
}

export function recoverAnalysisState(state) {
  if (!state?.isAnalyzing) return state;
  return {
    ...state,
    isAnalyzing: false,
    analysisNotice: "上次分析已中断，请重新提交。"
  };
}
```

- [ ] **Step 4: Run the task-state test and verify GREEN**

Run the command from Step 2.

Expected: exit code 0.

- [ ] **Step 5: Commit**

```powershell
git add src/analysisTask.js scripts/analysis-task.test.mjs
git commit -m "test: define recoverable analysis task state"
```

### Task 3: Wire Cancellation into the UI

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `scripts/ui-regression.test.mjs`

- [ ] **Step 1: Write failing UI regression assertions**

Require `data-cancel-analysis`, `handleCancelAnalysis`, `currentAnalysisTask`, `recoverAnalysisState`, and an `.analysis-actions` CSS rule.

```js
for (const hook of ["data-cancel-analysis", "handleCancelAnalysis", "currentAnalysisTask", "recoverAnalysisState"]) {
  assert.match(appSource, new RegExp(hook), `missing cancellation behavior: ${hook}`);
}
assert.match(cssSource, /\.analysis-actions\s*\{/, "missing analysis action layout");
```

- [ ] **Step 2: Run the UI regression test and verify RED**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\ui-regression.test.mjs
```

Expected: FAIL because the cancellation hooks and styles are absent.

- [ ] **Step 3: Implement startup recovery and task ownership**

Import the task helpers, recover persisted state in `loadState`, and declare one module-level active task:

```js
import {
  cancelAnalysisTask,
  createAnalysisTask,
  isCurrentAnalysisTask,
  recoverAnalysisState
} from "./analysisTask.js";

let currentAnalysisTask = null;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return normalizeState(structuredClone(seedState));
  try {
    return normalizeState(recoverAnalysisState({ ...structuredClone(seedState), ...JSON.parse(raw) }));
  } catch {
    return normalizeState(structuredClone(seedState));
  }
}
```

- [ ] **Step 4: Render and bind the cancel button**

Wrap buttons in `.analysis-actions`, render the cancel button only while analyzing, and bind it:

```html
<div class="analysis-actions">
  <button class="primary-button" type="submit" disabled>分析中...</button>
  <button class="secondary-button cancel-analysis-button" type="button" data-cancel-analysis>取消分析</button>
</div>
```

```js
document.querySelector("[data-cancel-analysis]")?.addEventListener("click", handleCancelAnalysis);

function handleCancelAnalysis() {
  const task = currentAnalysisTask;
  if (!task) return;
  cancelAnalysisTask(task);
  currentAnalysisTask = null;
  setState({ ...state, isAnalyzing: false, analysisNotice: "已取消本次分析。" });
}
```

- [ ] **Step 5: Rewrite analysis lifecycle with guarded result commits**

Create a task before setting `isAnalyzing`, pass its signal to the API client, skip fallback for cancellation, commit results only while the task remains current, and use `finally` for cleanup.

```js
const task = createAnalysisTask();
currentAnalysisTask = task;
setState({ ...state, isAnalyzing: true, analysisNotice: "正在调用真实模型分析图片，通常需要 10-30 秒。" });

try {
  analysis = await analyzeReferenceViaApi(reference, { signal: task.controller.signal });
} catch (error) {
  if (task.cancelled || error?.name === "AbortError") return;
  analysis = generateAnalysis(reference);
  analysisNotice = `真实模型分析暂不可用，已回退到离线演示分析：${error.message}`;
}

if (!isCurrentAnalysisTask(currentAnalysisTask, task)) return;
// existing result commit
finally {
  if (currentAnalysisTask?.id === task.id) {
    currentAnalysisTask = null;
    if (state.isAnalyzing) setState({ ...state, isAnalyzing: false });
  }
}
```

- [ ] **Step 6: Add action styles**

```css
.analysis-actions {
  display: grid;
  gap: 8px;
}

.analysis-actions .primary-button,
.analysis-actions .secondary-button {
  width: 100%;
  min-height: 44px;
}

.cancel-analysis-button {
  color: var(--text1);
}
```

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\analysis-task.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\api-client.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\ui-regression.test.mjs
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```powershell
git add src/app.js src/styles.css scripts/ui-regression.test.mjs
git commit -m "fix: recover and cancel image analysis"
```

### Task 4: Full Regression and Browser Verification

**Files:**
- Verify all `scripts/*.test.mjs`

- [ ] **Step 1: Run the complete test suite**

```powershell
Get-ChildItem scripts -Filter '*.test.mjs' | ForEach-Object {
  & 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Test failed: $($_.Name)" }
}
```

Expected: every test exits 0.

- [ ] **Step 2: Start the local server**

```powershell
Start-Process -FilePath 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' -ArgumentList 'scripts\static-server.js' -WorkingDirectory 'C:\Users\29986\Documents\idea' -WindowStyle Hidden
```

Expected: `http://127.0.0.1:4173/` responds.

- [ ] **Step 3: Verify cancellation in the browser**

Open the page, select real-model analysis, submit an image, click “取消分析”, and verify:

- the button disappears;
- the form becomes enabled;
- the notice says “已取消本次分析。”;
- the reference count does not increase.

- [ ] **Step 4: Verify refresh recovery**

Set persisted state to `isAnalyzing: true`, reload the page, and verify the form is enabled and the notice says “上次分析已中断，请重新提交。”.

- [ ] **Step 5: Inspect the final diff**

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: only the planned source, test, CSS, and plan files are changed; `git diff --check` exits 0.
