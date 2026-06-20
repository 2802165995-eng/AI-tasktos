# TasteOS Cloud-Primary Local-Fallback Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TasteOS use DashScope by default, ask before retrying with local Ollama, and launch idempotently from a Windows desktop shortcut.

**Architecture:** Keep the browser dependent on the existing `/api/analyze-reference` contract, adding an optional provider override and structured API errors. Add Ollama behind the existing server-side provider boundary, isolate the browser fallback decision in a small testable module, and add PowerShell launcher functions that health-check before starting a hidden Node process.

**Tech Stack:** Browser ES modules, Node.js HTTP server, DashScope compatible API, Ollama `/api/chat`, PowerShell 5.1+, Node built-in test assertions.

---

## File map

### Create

- `src/analysisFallback.js` — pure orchestration for cloud request, confirmation, and one Ollama retry.
- `scripts/analysis-fallback.test.mjs` — fallback behavior tests without DOM automation.
- `scripts/launcher-core.ps1` — reusable health-check, Node discovery, process launch, and browser functions.
- `scripts/start-tasteos.ps1` — user-facing idempotent launcher.
- `scripts/install-desktop-shortcut.ps1` — one-time desktop shortcut creation.
- `scripts/launcher.test.ps1` — launcher behavior and secret-redaction checks.
- `.env.local.example` — safe local configuration template.

### Modify

- `src/apiClient.js` — provider override and structured error object.
- `src/app.js` — replace silent Mock fallback with confirmation-driven Ollama fallback.
- `scripts/openai-analysis.mjs` — Ollama provider, output validation, and typed provider errors.
- `scripts/openai-analysis.test.mjs` — Ollama request, success, and error coverage.
- `scripts/api-client.test.mjs` — provider payload and structured API error coverage.
- `scripts/static-server.js` — provider allowlist, Ollama config, stable error responses, and safe request logging.
- `scripts/static-server.test.mjs` — unknown provider and fallback metadata coverage.
- `README.md` — personal-use setup and shortcut instructions.

## Task 1: Add provider override and structured browser errors

**Files:**

- Modify: `src/apiClient.js`
- Modify: `scripts/api-client.test.mjs`

- [ ] **Step 1: Add failing payload and structured-error tests**

Append tests that require a provider override to enter the request body:

```js
assert.deepEqual(
  buildAnalyzeReferencePayload(reference, { provider: "ollama" }),
  {
    ...payload,
    provider: "ollama"
  }
);
```

Replace the existing generic 503 rejection assertion with:

```js
await assert.rejects(
  () =>
    analyzeReferenceViaApi(reference, {
      fetchImpl: async () => ({
        ok: false,
        status: 502,
        json: async () => ({
          error: "云端模型暂时不可用",
          code: "CLOUD_PROVIDER_FAILED",
          canFallbackToLocal: true
        })
      })
    }),
  (error) => {
    assert.equal(error.name, "AnalysisApiError");
    assert.equal(error.message, "云端模型暂时不可用");
    assert.equal(error.status, 502);
    assert.equal(error.code, "CLOUD_PROVIDER_FAILED");
    assert.equal(error.canFallbackToLocal, true);
    return true;
  }
);
```

Add a request test:

```js
await analyzeReferenceViaApi(reference, {
  provider: "ollama",
  fetchImpl: async (_url, options) => {
    assert.equal(JSON.parse(options.body).provider, "ollama");
    return {
      ok: true,
      json: async () => ({
        analysis: { id: "analysis-ref-test", referenceId: "ref-test" }
      })
    };
  }
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\api-client.test.mjs
```

Expected: FAIL because `buildAnalyzeReferencePayload` ignores options and API errors do not expose structured fields.

- [ ] **Step 3: Implement provider-aware payloads and `AnalysisApiError`**

Change the function signature:

```js
export function buildAnalyzeReferencePayload(reference, options = {}) {
  const payload = {
    id: reference.id
  };

  const provider = String(options.provider || "").trim().toLowerCase();
  if (provider) payload.provider = provider;

  const title = String(reference.title || "").trim();
  const userNote = String(reference.userNote || "").trim();
  if (title) payload.title = title;
  if (reference.category) payload.category = reference.category;
  if (userNote) payload.userNote = userNote;

  if (reference.imageBase64) {
    payload.imageBase64 = reference.imageBase64;
  } else if (reference.imageUrl) {
    payload.imageUrl = reference.imageUrl;
  }

  return payload;
}
```

Add:

```js
export class AnalysisApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AnalysisApiError";
    this.status = options.status || 0;
    this.code = options.code || "ANALYSIS_REQUEST_FAILED";
    this.canFallbackToLocal = Boolean(options.canFallbackToLocal);
  }
}
```

Build the request body with:

```js
body: JSON.stringify(
  buildAnalyzeReferencePayload(reference, {
    provider: options.provider
  })
)
```

Replace the non-OK response error with:

```js
throw new AnalysisApiError(
  body.error || `Analyze reference failed with status ${response.status}`,
  {
    status: response.status,
    code: body.code,
    canFallbackToLocal: body.canFallbackToLocal
  }
);
```

- [ ] **Step 4: Run the API client test**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/apiClient.js scripts/api-client.test.mjs
git commit -m "feat: support explicit analysis providers"
```

## Task 2: Add the Ollama vision provider

**Files:**

- Modify: `scripts/openai-analysis.mjs`
- Modify: `scripts/openai-analysis.test.mjs`

- [ ] **Step 1: Add failing Ollama request-shape tests**

Import `buildOllamaAnalysisRequest` and `validateVisualAnalysis` in the test.

Use one complete fixture for all provider success tests:

```js
const validAnalysis = {
  inferredPrompt: "生成一张层级清晰、标题醒目的活动海报。",
  keyPromptTerms: ["醒目标题", "高对比", "单一焦点", "清晰层级"],
  negativePromptTerms: ["文字不可读", "画面拥挤"],
  usageCategory: "活动海报",
  styleCategory: "科技海报",
  compositionTerms: ["单一视觉焦点", "标题优先"],
  colorTerms: ["深色背景", "暖色强调"],
  typographyTerms: ["粗体无衬线", "清晰辅助文字"],
  moodTerms: ["现代", "专业"],
  reusablePromptPatterns: ["大标题优先", "少量强调色"],
  composition: "主标题占据第一视觉层级。",
  colorPalette: ["#111111", "#ffffff", "#e95034"],
  colorDescription: "深色背景配高对比强调色。",
  typography: "粗体无衬线标题。",
  informationHierarchy: "标题、主视觉、行动信息三层结构。",
  moodTags: ["现代", "科技"],
  styleTags: ["大标题", "高对比"],
  usageScenario: "活动海报",
  reusablePatterns: ["大标题优先", "单一视觉焦点"],
  avoidPatterns: ["文字不可读", "信息过密"]
};
```

Add:

```js
const ollamaRequest = buildOllamaAnalysisRequest(
  {
    ...requestPayload,
    imageBase64: "data:image/jpeg;base64,YWJj",
    imageUrl: ""
  },
  { model: "qwen3-vl:8b" }
);

assert.equal(ollamaRequest.model, "qwen3-vl:8b");
assert.equal(ollamaRequest.stream, false);
assert.equal(ollamaRequest.format.type, "object");
assert.deepEqual(ollamaRequest.messages[0].images, ["YWJj"]);
assert.equal(validateVisualAnalysis(validAnalysis), null);
assert.match(validateVisualAnalysis({ ...validAnalysis, moodTags: [] }), /moodTags/);
```

- [ ] **Step 2: Add failing Ollama success and error tests**

```js
const ollamaCalls = [];
const ollamaAnalysis = await createApiAnalysis(
  {
    ...requestPayload,
    imageBase64: "data:image/jpeg;base64,YWJj",
    imageUrl: ""
  },
  {
    provider: "ollama",
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: "qwen3-vl:8b",
    fetchImpl: async (url, options) => {
      ollamaCalls.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          message: { content: JSON.stringify(validAnalysis) }
        })
      };
    }
  }
);

assert.equal(ollamaCalls[0].url, "http://127.0.0.1:11434/api/chat");
assert.equal(ollamaAnalysis.referenceId, "ref-test");
```

Add rejected cases for:

```js
await assert.rejects(
  () =>
    createApiAnalysis(requestPayload, {
      provider: "ollama",
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen3-vl:8b",
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      }
    }),
  (error) => error.code === "OLLAMA_UNAVAILABLE"
);

await assert.rejects(
  () =>
    createApiAnalysis(requestPayload, {
      provider: "ollama",
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "missing-model",
      fetchImpl: async () => ({
        ok: false,
        status: 404,
        json: async () => ({ error: "model 'missing-model' not found" })
      })
    }),
  (error) => error.code === "OLLAMA_MODEL_MISSING"
);
```

- [ ] **Step 3: Run the provider test and verify failure**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\openai-analysis.test.mjs
```

Expected: FAIL because the Ollama exports and provider do not exist.

- [ ] **Step 4: Implement typed provider errors**

Add:

```js
export class AnalysisProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AnalysisProviderError";
    this.code = options.code || "PROVIDER_FAILED";
    this.provider = options.provider || "unknown";
    this.status = options.status || 502;
    this.canFallbackToLocal = Boolean(options.canFallbackToLocal);
  }
}
```

Change provider routing to an explicit allowlist:

```js
const provider = String(options.provider || "openai").trim().toLowerCase();

if (provider === "dashscope") {
  return createDashScopeApiAnalysis(reference, options);
}
if (provider === "ollama") {
  return createOllamaApiAnalysis(reference, options);
}
if (provider === "openai") {
  return createOpenAIApiAnalysis(reference, options);
}

throw new AnalysisProviderError(`不支持的模型服务：${provider}`, {
  code: "UNKNOWN_PROVIDER",
  provider,
  status: 400
});
```

Extract the existing OpenAI branch into `createOpenAIApiAnalysis`.

- [ ] **Step 5: Implement schema validation**

Add a validator that checks:

```js
export function validateVisualAnalysis(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "analysis must be an object";
  }

  for (const field of visualAnalysisSchema.required) {
    if (!(field in value)) return `${field} is required`;
    const rule = visualAnalysisSchema.properties[field];
    if (rule.type === "string" && typeof value[field] !== "string") {
      return `${field} must be a string`;
    }
    if (rule.type === "array") {
      if (!Array.isArray(value[field])) return `${field} must be an array`;
      if (rule.minItems && value[field].length < rule.minItems) {
        return `${field} must contain at least ${rule.minItems} items`;
      }
      if (rule.maxItems && value[field].length > rule.maxItems) {
        return `${field} must contain no more than ${rule.maxItems} items`;
      }
    }
  }

  return null;
}
```

Call it after parsing every provider response. Throw `INVALID_MODEL_OUTPUT` instead of allowing incomplete model data into application state.

- [ ] **Step 6: Implement Ollama image normalization and request**

Add:

```js
function stripDataUrlPrefix(imageInput) {
  const match = String(imageInput || "").match(/^data:[^;]+;base64,(.+)$/s);
  return match ? match[1] : String(imageInput || "");
}

export function buildOllamaAnalysisRequest(reference, options = {}) {
  return {
    model: options.model,
    stream: false,
    format: visualAnalysisSchema,
    messages: [
      {
        role: "user",
        content: buildAnalysisPrompt(reference),
        images: [stripDataUrlPrefix(reference.imageBase64 || reference.imageUrl)]
      }
    ]
  };
}
```

For remote image URLs, use this server-side normalization before calling Ollama:

```js
async function normalizeOllamaReferenceImage(reference, fetchImpl) {
  if (reference.imageBase64) return reference;

  let response;
  try {
    response = await fetchImpl(reference.imageUrl);
  } catch {
    throw new AnalysisProviderError("无法下载待分析图片。", {
      code: "INVALID_IMAGE_INPUT",
      provider: "ollama",
      status: 400
    });
  }

  const contentType = response.headers?.get?.("content-type") || "";
  if (!response.ok || !contentType.startsWith("image/")) {
    throw new AnalysisProviderError("图片链接未返回有效图片。", {
      code: "INVALID_IMAGE_INPUT",
      provider: "ollama",
      status: 400
    });
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 8 * 1024 * 1024) {
    throw new AnalysisProviderError("图片超过 8 MB，请压缩后重试。", {
      code: "INVALID_IMAGE_INPUT",
      provider: "ollama",
      status: 413
    });
  }

  return {
    ...reference,
    imageUrl: "",
    imageBase64: `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`
  };
}
```

Implement the call:

```js
const response = await fetchImpl(`${baseUrl}/api/chat`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(buildOllamaAnalysisRequest(normalizedReference, { model }))
});
```

Map connection errors to:

```text
OLLAMA_UNAVAILABLE
无法连接本地 Ollama。请先启动 Ollama，然后重试。
```

Map a 404 or response text containing `model` and `not found` to:

```text
OLLAMA_MODEL_MISSING
本地模型 qwen3-vl:8b 尚未安装。请运行：ollama pull qwen3-vl:8b
```

- [ ] **Step 7: Mark DashScope/OpenAI failures as locally recoverable**

Wrap their configuration, network, HTTP, and output errors in `AnalysisProviderError` with:

```js
{
  code: "CLOUD_PROVIDER_FAILED",
  provider,
  status: upstreamStatus === 429 ? 429 : 502,
  canFallbackToLocal: true
}
```

Do not set `canFallbackToLocal` on validation errors caused by a malformed browser request.

- [ ] **Step 8: Run provider tests**

Run the command from Step 3.

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add scripts/openai-analysis.mjs scripts/openai-analysis.test.mjs
git commit -m "feat: add local ollama vision provider"
```

## Task 3: Return stable fallback metadata from the local server

**Files:**

- Modify: `scripts/static-server.js`
- Modify: `scripts/static-server.test.mjs`

- [ ] **Step 1: Add failing server error-contract tests**

Create a second test server with a deliberately unknown default provider:

```js
const errorServer = createTasteOsServer({
  root: new URL("..", import.meta.url),
  env: { AI_PROVIDER: "unknown-provider" }
});
```

POST a minimal valid reference and assert:

```js
assert.equal(response.status, 400);
assert.deepEqual(await response.json(), {
  error: "不支持的模型服务：unknown-provider",
  code: "UNKNOWN_PROVIDER",
  canFallbackToLocal: false
});
```

Add a request with `"provider": "not-allowed"` and assert it is rejected even when the environment default is valid.

- [ ] **Step 2: Run the server test and verify failure**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\static-server.test.mjs
```

Expected: FAIL because the server currently returns only `{ error }`.

- [ ] **Step 3: Pass provider and Ollama configuration to the provider layer**

In `handleAnalyzeReference`, choose:

```js
const requestedProvider = String(payload.provider || env.AI_PROVIDER || "openai")
  .trim()
  .toLowerCase();
```

Pass:

```js
provider: requestedProvider,
ollamaBaseUrl: env.OLLAMA_BASE_URL,
ollamaModel: env.OLLAMA_MODEL
```

Remove `provider` from the reference object passed to model prompt construction:

```js
const { provider: _provider, ...reference } = payload;
```

- [ ] **Step 4: Emit stable errors and safe logs**

Use:

```js
const status = Number(error?.status) || 500;
const code = error?.code || "ANALYSIS_FAILED";
const canFallbackToLocal = Boolean(error?.canFallbackToLocal);

console.error(
  JSON.stringify({
    event: "analysis_failed",
    provider: error?.provider || requestedProvider,
    code,
    message
  })
);

response.writeHead(status);
response.end(JSON.stringify({ error: message, code, canFallbackToLocal }));
```

Never log the request body, environment object, Base64 image, or authorization header.

- [ ] **Step 5: Run server tests**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add scripts/static-server.js scripts/static-server.test.mjs
git commit -m "feat: expose analysis fallback metadata"
```

## Task 4: Isolate and test the cloud-to-local decision

**Files:**

- Create: `src/analysisFallback.js`
- Create: `scripts/analysis-fallback.test.mjs`

- [ ] **Step 1: Write fallback coordinator tests**

Create tests for:

1. Cloud success returns immediately and never asks.
2. Non-fallback errors are rethrown.
3. User cancellation returns a cancelled result and does not call Ollama.
4. User confirmation makes exactly one Ollama request.
5. Ollama errors are rethrown without another confirmation.

Representative test:

```js
const calls = [];
const result = await analyzeWithOptionalLocalFallback(reference, {
  analyze: async (_reference, options) => {
    calls.push(options.provider || "default");
    if (!options.provider) {
      const error = new Error("云端失败");
      error.canFallbackToLocal = true;
      throw error;
    }
    return { id: "analysis-ref-test", referenceId: "ref-test" };
  },
  confirmLocalFallback: async (error) => {
    assert.equal(error.message, "云端失败");
    return true;
  }
});

assert.deepEqual(calls, ["default", "ollama"]);
assert.equal(result.provider, "ollama");
assert.equal(result.cancelled, false);
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\analysis-fallback.test.mjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the coordinator**

```js
export async function analyzeWithOptionalLocalFallback(reference, options) {
  const analyze = options.analyze;
  const confirmLocalFallback = options.confirmLocalFallback;
  const signal = options.signal;

  try {
    const analysis = await analyze(reference, { signal });
    return { analysis, provider: "cloud", cancelled: false };
  } catch (error) {
    if (signal?.aborted || error?.name === "AbortError") throw error;
    if (!error?.canFallbackToLocal) throw error;

    const confirmed = await confirmLocalFallback(error);
    if (!confirmed) {
      return { analysis: null, provider: null, cancelled: true, error };
    }

    const analysis = await analyze(reference, {
      provider: "ollama",
      signal
    });
    return { analysis, provider: "ollama", cancelled: false };
  }
}
```

- [ ] **Step 4: Run fallback tests**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/analysisFallback.js scripts/analysis-fallback.test.mjs
git commit -m "feat: coordinate optional local model fallback"
```

## Task 5: Replace the silent Mock fallback in the UI

**Files:**

- Modify: `src/app.js`
- Modify: `scripts/text-integrity.test.mjs`

- [ ] **Step 1: Add a failing source-integrity assertion**

Extend `scripts/text-integrity.test.mjs` to assert that `src/app.js`:

```js
assert.match(appSource, /analyzeWithOptionalLocalFallback/);
assert.doesNotMatch(appSource, /已回退到离线演示分析/);
assert.match(appSource, /是否改用本地 Ollama/);
```

- [ ] **Step 2: Run the integrity test and verify failure**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\text-integrity.test.mjs
```

Expected: FAIL because the UI still performs silent Mock fallback.

- [ ] **Step 3: Import and call the coordinator**

Add:

```js
import { analyzeWithOptionalLocalFallback } from "./analysisFallback.js";
```

Replace the nested API catch with:

```js
const result = await analyzeWithOptionalLocalFallback(reference, {
  signal: task.controller.signal,
  analyze: analyzeReferenceViaApi,
  confirmLocalFallback: async (error) =>
    window.confirm(
      [
        `云端模型分析失败：${error.message}`,
        "",
        "是否改用本地 Ollama 模型继续分析？",
        "本地模型需要 Ollama 正在运行，并已安装 qwen3-vl:8b。"
      ].join("\n")
    )
});

if (result.cancelled) {
  if (!isCurrentAnalysisTask(currentAnalysisTask, task)) return;
  setState({
    ...state,
    isAnalyzing: false,
    analysisNotice: "已取消切换本地模型。图片和输入内容已保留。"
  });
  return;
}

analysis = result.analysis;
analysisNotice =
  result.provider === "ollama"
    ? "云端模型不可用，已按你的选择使用本地 Ollama 完成分析。"
    : "已使用云端模型完成视觉分析。";
```

In the outer catch, show the final cloud or Ollama error without creating a reference:

```js
if (task.cancelled || error?.name === "AbortError") return;
if (!isCurrentAnalysisTask(currentAnalysisTask, task)) return;
setState({
  ...state,
  isAnalyzing: false,
  analysisNotice: `分析失败：${error.message}`
});
return;
```

Keep `generateAnalysis(reference)` only in the explicit Mock branch.

- [ ] **Step 4: Preserve upload form values during state rerenders**

Before starting analysis, capture:

```js
const draftInput = {
  title: String(data.get("title") || ""),
  imageUrl: urlInput
};
```

Store these fields in state as `uploadDraft`, bind their values in the upload form, and clear them only after a successful analysis. This satisfies the requirement that cancelling fallback keeps user input.

- [ ] **Step 5: Run focused browser-domain tests**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\analysis-fallback.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\analysis-task.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\text-integrity.test.mjs
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/app.js src/analysisFallback.js scripts/analysis-fallback.test.mjs scripts/text-integrity.test.mjs
git commit -m "feat: ask before using local model fallback"
```

## Task 6: Build an idempotent hidden Windows launcher

**Files:**

- Create: `scripts/launcher-core.ps1`
- Create: `scripts/start-tasteos.ps1`
- Create: `scripts/launcher.test.ps1`

- [ ] **Step 1: Write failing launcher-core tests**

The test should dot-source `launcher-core.ps1` and verify:

```powershell
$config = Get-TasteOsLauncherConfig -Root $root
Assert-Equal $config.HealthUrl "http://127.0.0.1:4173/health"
Assert-Equal $config.AppUrl "http://127.0.0.1:4173/"
Assert-Equal (Test-TasteOsHealthBody -Body '{"status":"ok"}') $true
Assert-Equal (Test-TasteOsHealthBody -Body '{"status":"other"}') $false
```

Test `Find-TasteOsNode` with injected candidates:

```powershell
$node = Find-TasteOsNode -Candidates @($fakeNodePath)
Assert-Equal $node $fakeNodePath
```

Test log redaction:

```powershell
$redacted = Protect-TasteOsLogText -Text "DASHSCOPE_API_KEY=secret-value"
Assert-NotMatch $redacted "secret-value"
Assert-Match $redacted "DASHSCOPE_API_KEY=\[REDACTED\]"
```

- [ ] **Step 2: Run the PowerShell test and verify failure**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\launcher.test.ps1
```

Expected: FAIL because `launcher-core.ps1` does not exist.

- [ ] **Step 3: Implement launcher configuration and health checks**

Create functions:

```powershell
function Get-TasteOsLauncherConfig {
  param([Parameter(Mandatory = $true)][string]$Root)
  [pscustomobject]@{
    Root = [System.IO.Path]::GetFullPath($Root)
    Host = "127.0.0.1"
    Port = 4173
    HealthUrl = "http://127.0.0.1:4173/health"
    AppUrl = "http://127.0.0.1:4173/"
    LogDirectory = Join-Path $Root ".tasteos"
  }
}

function Test-TasteOsHealthBody {
  param([string]$Body)
  try {
    $value = $Body | ConvertFrom-Json
    $propertyNames = @($value.PSObject.Properties.Name)
    return $value.status -eq "ok" -and
      $propertyNames.Count -eq 1 -and
      $propertyNames[0] -eq "status"
  } catch {
    return $false
  }
}

function Test-TasteOsHealth {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    return $response.StatusCode -eq 200 -and
      (Test-TasteOsHealthBody -Body $response.Content)
  } catch {
    return $false
  }
}
```

- [ ] **Step 4: Implement Node discovery**

Search in order:

1. `(Get-Command node.exe -ErrorAction SilentlyContinue).Source`
2. `C:\Users\<current-user>\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

Return the first existing file. Throw:

```text
未找到 Node.js。请安装 Node.js，或确认 Codex bundled Node 仍存在。
```

- [ ] **Step 5: Implement hidden detached startup**

Create `.tasteos` if missing. Start with:

```powershell
$process = Start-Process `
  -FilePath $NodePath `
  -ArgumentList @("scripts\static-server.js") `
  -WorkingDirectory $Config.Root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -PassThru
```

Poll health every 500 ms for up to 15 seconds. If health never succeeds:

- If the process exited, report its exit code.
- If the port responds with a body other than `{"status":"ok"}`, report a port conflict.
- Otherwise report startup timeout.
- Include both log paths in the error.

Do not write `.env.local` contents into the logs.

- [ ] **Step 6: Implement user-facing `start-tasteos.ps1`**

The script must:

```powershell
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "launcher-core.ps1")

$root = Split-Path -Parent $PSScriptRoot
$config = Get-TasteOsLauncherConfig -Root $root

if (-not (Test-TasteOsHealth -Url $config.HealthUrl)) {
  $nodePath = Find-TasteOsNode
  Start-TasteOsBackground -Config $config -NodePath $nodePath
}

Start-Process $config.AppUrl
```

On failure, show a Windows message box containing the error and log location, then exit non-zero.

- [ ] **Step 7: Run launcher tests**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 8: Manually verify idempotency**

Run twice:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-tasteos.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-tasteos.ps1
```

Then verify:

```powershell
(Invoke-RestMethod http://127.0.0.1:4173/health).status
```

Expected: `ok`, and only one Node process has `scripts/static-server.js` in its command line.

- [ ] **Step 9: Commit**

```powershell
git add scripts/launcher-core.ps1 scripts/start-tasteos.ps1 scripts/launcher.test.ps1
git commit -m "feat: add idempotent windows launcher"
```

## Task 7: Add desktop shortcut installation

**Files:**

- Create: `scripts/install-desktop-shortcut.ps1`
- Modify: `scripts/launcher.test.ps1`

- [ ] **Step 1: Add a failing shortcut argument test**

Require a pure helper:

```powershell
$shortcut = Get-TasteOsShortcutSpec -Root $root
Assert-Equal $shortcut.Name "启动 TasteOS.lnk"
Assert-Match $shortcut.Arguments "-ExecutionPolicy Bypass"
Assert-Match $shortcut.Arguments "start-tasteos.ps1"
Assert-Equal $shortcut.WorkingDirectory $root
```

- [ ] **Step 2: Run launcher tests and verify failure**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\launcher.test.ps1
```

Expected: FAIL because the shortcut helper does not exist.

- [ ] **Step 3: Implement shortcut specification**

Add to `launcher-core.ps1`:

```powershell
function Get-TasteOsShortcutSpec {
  param([Parameter(Mandatory = $true)][string]$Root)
  $scriptPath = Join-Path $Root "scripts\start-tasteos.ps1"
  [pscustomobject]@{
    Name = "启动 TasteOS.lnk"
    TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
    WorkingDirectory = $Root
  }
}
```

- [ ] **Step 4: Implement shortcut installer**

Use the current user desktop:

```powershell
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop $spec.Name
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $spec.TargetPath
$shortcut.Arguments = $spec.Arguments
$shortcut.WorkingDirectory = $spec.WorkingDirectory
$shortcut.Description = "启动 TasteOS 本地网页应用"
$shortcut.Save()
```

Print the created path and explain that moving the project requires reinstalling the shortcut.

- [ ] **Step 5: Run tests and install the shortcut**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\launcher.test.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-desktop-shortcut.ps1
```

Expected: tests PASS and desktop contains `启动 TasteOS.lnk`.

- [ ] **Step 6: Commit**

```powershell
git add scripts/launcher-core.ps1 scripts/install-desktop-shortcut.ps1 scripts/launcher.test.ps1
git commit -m "feat: install tasteos desktop shortcut"
```

## Task 8: Add safe configuration and personal-use documentation

**Files:**

- Create: `.env.local.example`
- Modify: `README.md`

- [ ] **Step 1: Create the safe environment template**

```text
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=replace-with-your-key
DASHSCOPE_MODEL=qwen3-vl-flash
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3-vl:8b

HOST=127.0.0.1
PORT=4173
```

- [ ] **Step 2: Document initial setup**

Add exact commands:

```powershell
Copy-Item .env.local.example .env.local
ollama pull qwen3-vl:8b
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-desktop-shortcut.ps1
```

Explain:

- DashScope is the default.
- Ollama is only called after cloud failure and user confirmation.
- Ollama may remain stopped until needed.
- Closing the browser does not stop TasteOS.
- Restarting Windows stops the local service.
- Logs are under `.tasteos`.
- `.env.local` must never be committed or shared.

- [ ] **Step 3: Document troubleshooting**

Cover:

- Missing Node.
- Invalid DashScope key.
- Ollama not running.
- Missing `qwen3-vl:8b`.
- Port 4173 conflict.
- Project moved after shortcut installation.

- [ ] **Step 4: Run text and packaging checks**

Run:

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\text-integrity.test.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\aliyun-package.test.ps1
```

Expected: PASS. Confirm `.env.local.example` may be documented but `.env.local` remains excluded from deployment artifacts.

- [ ] **Step 5: Commit**

```powershell
git add .env.local.example README.md
git commit -m "docs: add personal tasteos setup"
```

## Task 9: Full verification and live provider checks

**Files:**

- Modify only if verification finds defects.

- [ ] **Step 1: Run every Node test**

```powershell
$node = 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
Get-ChildItem .\scripts\*.test.mjs | ForEach-Object {
  & $node $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: all tests exit 0.

- [ ] **Step 2: Run every PowerShell test**

```powershell
Get-ChildItem .\scripts\*.test.ps1 | ForEach-Object {
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: all tests exit 0.

- [ ] **Step 3: Verify cloud success**

With a valid `.env.local`, launch TasteOS, select “真实模型分析,” upload one small image, and verify:

- The page reports cloud-model success.
- No fallback dialog appears.
- The new reference is saved once.
- Server logs do not contain `DASHSCOPE_API_KEY` or Base64 data.

- [ ] **Step 4: Verify user-cancelled fallback**

Temporarily set an invalid DashScope key, restart the local service, submit an image, and select Cancel in the fallback dialog.

Expected:

- No Mock analysis is created.
- No reference is added.
- Form title and image preview remain.
- UI reports that local fallback was cancelled.

- [ ] **Step 5: Verify successful Ollama fallback**

Run:

```powershell
ollama serve
ollama pull qwen3-vl:8b
```

Submit again with the invalid cloud key and confirm local fallback.

Expected:

- Exactly one cloud request and one Ollama request occur.
- A valid reference and analysis are added once.
- UI reports that Ollama completed the analysis.

- [ ] **Step 6: Verify Ollama failure guidance**

Stop Ollama and confirm local fallback again.

Expected: UI says Ollama cannot be reached and tells the user to start it. No Mock result is created.

- [ ] **Step 7: Verify shortcut lifecycle**

Double-click the desktop shortcut twice, close all browser windows, and run:

```powershell
Invoke-RestMethod http://127.0.0.1:4173/health
```

Expected: `{ status: "ok" }`, with one TasteOS server process still running.

- [ ] **Step 8: Check worktree scope**

```powershell
git status --short
git diff --check
```

Expected: only intended files are modified. Do not stage or alter the existing untracked `docs/portfolio-video/` directory.

- [ ] **Step 9: Commit any verification fixes**

If verification required code changes:

```powershell
git add <only-the-files-fixed>
git commit -m "fix: harden local fallback startup flow"
```

If no fixes were required, do not create an empty commit.
