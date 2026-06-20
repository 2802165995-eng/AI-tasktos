export function buildAnalyzeReferencePayload(reference) {
  const payload = {
    id: reference.id
  };

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

const DEFAULT_ANALYSIS_TIMEOUT_MS = 45_000;

export async function analyzeReferenceViaApi(reference, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_ANALYSIS_TIMEOUT_MS;
  const controller = new AbortController();
  let didTimeout = false;
  const forwardAbort = () => {
    controller.abort(options.signal.reason || new DOMException("用户取消分析", "AbortError"));
  };

  options.signal?.addEventListener("abort", forwardAbort, { once: true });
  if (options.signal?.aborted) forwardAbort();

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort(new DOMException("模型分析超时", "TimeoutError"));
  }, timeoutMs);

  try {
    const response = await fetchImpl("/api/analyze-reference", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(buildAnalyzeReferencePayload(reference)),
      signal: controller.signal
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || `Analyze reference failed with status ${response.status}`);
    }

    if (!body.analysis) {
      throw new Error("Analyze reference response is missing analysis");
    }

    return body.analysis;
  } catch (error) {
    if (didTimeout) {
      throw new Error("模型分析超时，请重试。");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}
