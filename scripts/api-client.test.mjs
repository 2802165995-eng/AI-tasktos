import assert from "node:assert/strict";
import { analyzeReferenceViaApi, buildAnalyzeReferencePayload } from "../src/apiClient.js";

const reference = {
  id: "ref-test",
  title: "Campus AI Poster",
  category: "event_poster",
  userNote: "喜欢大标题和科技感",
  imageUrl: "https://example.com/poster.jpg",
  imageBase64: ""
};

const payload = buildAnalyzeReferencePayload(reference);

assert.deepEqual(payload, {
  id: "ref-test",
  title: "Campus AI Poster",
  category: "event_poster",
  userNote: "喜欢大标题和科技感",
  imageUrl: "https://example.com/poster.jpg"
});

const imageOnlyPayload = buildAnalyzeReferencePayload({
  id: "ref-image-only",
  imageUrl: "https://example.com/only-image.jpg"
});

assert.deepEqual(imageOnlyPayload, {
  id: "ref-image-only",
  imageUrl: "https://example.com/only-image.jpg"
});

const calls = [];
const analysis = await analyzeReferenceViaApi(reference, {
  fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        analysis: {
          id: "analysis-ref-test",
          referenceId: "ref-test",
          composition: "清晰主标题",
          colorPalette: ["#111111", "#ffffff", "#e95034"],
          colorDescription: "高对比配色",
          typography: "粗体标题",
          informationHierarchy: "标题优先",
          moodTags: ["现代", "科技"],
          styleTags: ["大标题", "高对比"],
          usageScenario: "活动海报",
          reusablePatterns: ["大标题优先", "单一视觉焦点"],
          avoidPatterns: ["文字不可读", "信息过密"]
        }
      })
    };
  }
});

assert.equal(calls.length, 1);
assert.equal(calls[0].url, "/api/analyze-reference");
assert.equal(calls[0].options.method, "POST");
assert.equal(calls[0].options.headers["content-type"], "application/json");
assert.deepEqual(JSON.parse(calls[0].options.body), payload);
assert.equal(analysis.referenceId, "ref-test");
assert.deepEqual(analysis.moodTags, ["现代", "科技"]);

await assert.rejects(
  () =>
    analyzeReferenceViaApi(reference, {
      fetchImpl: async () => ({
        ok: false,
        status: 503,
        json: async () => ({ error: "请在 .env.local 中配置 OPENAI_API_KEY" })
      })
    }),
  /请在 \.env\.local 中配置 OPENAI_API_KEY/
);

const cancellationController = new AbortController();
let receivedSignal;
const cancelledRequest = analyzeReferenceViaApi(reference, {
  signal: cancellationController.signal,
  timeoutMs: 1000,
  fetchImpl: async (_url, options) => {
    receivedSignal = options.signal;
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    });
  }
});

cancellationController.abort(new DOMException("用户取消分析", "AbortError"));

await assert.rejects(cancelledRequest, (error) => error.name === "AbortError");
assert.ok(receivedSignal.aborted);

await assert.rejects(
  () =>
    analyzeReferenceViaApi(reference, {
      timeoutMs: 5,
      fetchImpl: async (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
        })
    }),
  /模型分析超时，请重试/
);
