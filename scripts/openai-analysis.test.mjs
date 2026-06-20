import assert from "node:assert/strict";
import {
  buildDashScopeAnalysisRequest,
  buildOpenAIAnalysisRequest,
  createApiAnalysis,
  parseJsonBody,
  validateAnalysisRequest
} from "./openai-analysis.mjs";

const requestPayload = {
  id: "ref-test",
  title: "Campus AI Poster",
  category: "event_poster",
  userNote: "喜欢大标题和科技感",
  imageUrl: "https://example.com/poster.jpg"
};

assert.equal(validateAnalysisRequest(requestPayload), null);
assert.match(validateAnalysisRequest({ ...requestPayload, imageUrl: "" }), /imageUrl or imageBase64/);
assert.equal(validateAnalysisRequest({ id: "ref-image-only", imageUrl: "https://example.com/only.jpg" }), null);

const parsed = await parseJsonBody({
  on(eventName, callback) {
    if (eventName === "data") callback(Buffer.from(JSON.stringify(requestPayload)));
    if (eventName === "end") callback();
    return this;
  }
});

assert.deepEqual(parsed, requestPayload);

const openAIRequest = buildOpenAIAnalysisRequest(requestPayload, {
  model: "vision-model"
});

assert.equal(openAIRequest.model, "vision-model");
assert.equal(openAIRequest.input[0].role, "user");
assert.equal(openAIRequest.input[0].content[1].type, "input_image");
assert.equal(openAIRequest.text.format.type, "json_schema");
assert.equal(openAIRequest.text.format.strict, true);
assert.match(openAIRequest.input[0].content[0].text, /自动识别/);
assert.ok(openAIRequest.text.format.schema.properties.inferredPrompt);
assert.ok(openAIRequest.text.format.schema.properties.keyPromptTerms);
assert.ok(openAIRequest.text.format.schema.required.includes("inferredPrompt"));

const calls = [];
const analysis = await createApiAnalysis(requestPayload, {
  apiKey: "test-key",
  model: "vision-model",
  fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          composition: "清晰主标题",
          colorPalette: ["#111111", "#ffffff", "#e95034"],
          colorDescription: "高对比配色",
          typography: "粗体标题",
          informationHierarchy: "标题优先",
          moodTags: ["现代", "科技"],
          styleTags: ["大标题", "高对比"],
          usageScenario: "活动海报",
          inferredPrompt: "生成一张层级清晰、标题醒目的活动海报。",
          keyPromptTerms: ["醒目可读标题", "高对比"],
          negativePromptTerms: ["文字不可读", "画面拥挤"],
          usageCategory: "活动海报",
          styleCategory: "科技海报",
          compositionTerms: ["单一视觉焦点"],
          colorTerms: ["深色背景", "暖色强调"],
          typographyTerms: ["粗体无衬线"],
          moodTerms: ["现代", "专业"],
          reusablePromptPatterns: ["大标题优先"],
          reusablePatterns: ["大标题优先", "单一视觉焦点"],
          avoidPatterns: ["文字不可读", "信息过密"]
        })
      })
    };
  }
});

assert.equal(calls[0].url, "https://api.openai.com/v1/responses");
assert.equal(calls[0].options.headers.authorization, "Bearer test-key");
assert.equal(analysis.id, "analysis-ref-test");
assert.equal(analysis.referenceId, "ref-test");
assert.equal(analysis.composition, "清晰主标题");

await assert.rejects(
  () =>
    createApiAnalysis(requestPayload, {
      apiKey: "",
      model: "vision-model",
      fetchImpl: async () => ({})
    }),
  /请在 \.env\.local 中配置 OPENAI_API_KEY/
);

await assert.rejects(
  () =>
    createApiAnalysis(requestPayload, {
      apiKey: "test-key",
      model: "",
      fetchImpl: async () => ({})
    }),
  /请在 \.env\.local 中配置 OPENAI_MODEL/
);

await assert.rejects(
  () =>
    createApiAnalysis(requestPayload, {
      provider: "dashscope",
      dashScopeApiKey: "",
      dashScopeModel: "qwen3-vl-flash",
      fetchImpl: async () => ({})
    }),
  /请在 \.env\.local 中配置 DASHSCOPE_API_KEY/
);

await assert.rejects(
  () =>
    createApiAnalysis(requestPayload, {
      provider: "dashscope",
      dashScopeApiKey: "dashscope-test-key",
      dashScopeModel: "",
      fetchImpl: async () => ({})
    }),
  /请在 \.env\.local 中配置 DASHSCOPE_MODEL/
);

const dashScopeRequest = buildDashScopeAnalysisRequest(requestPayload, {
  model: "qwen3-vl-flash"
});

assert.equal(dashScopeRequest.model, "qwen3-vl-flash");
assert.equal(dashScopeRequest.messages[0].role, "user");
assert.equal(dashScopeRequest.messages[0].content[1].type, "image_url");
assert.equal(dashScopeRequest.messages[0].content[1].image_url.url, requestPayload.imageUrl);

const dashScopeCalls = [];
const dashScopeAnalysis = await createApiAnalysis(requestPayload, {
  provider: "dashscope",
  dashScopeApiKey: "dashscope-test-key",
  dashScopeModel: "qwen3-vl-flash",
  dashScopeBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  fetchImpl: async (url, options) => {
    dashScopeCalls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                composition: "清晰主标题",
                colorPalette: ["#111111", "#ffffff", "#e95034"],
                colorDescription: "高对比配色",
                typography: "粗体标题",
                informationHierarchy: "标题优先",
                moodTags: ["现代", "科技"],
                styleTags: ["大标题", "高对比"],
                usageScenario: "活动海报",
                inferredPrompt: "生成一张层级清晰、标题醒目的活动海报。",
                keyPromptTerms: ["醒目可读标题", "高对比"],
                negativePromptTerms: ["文字不可读", "画面拥挤"],
                usageCategory: "活动海报",
                styleCategory: "科技海报",
                compositionTerms: ["单一视觉焦点"],
                colorTerms: ["深色背景", "暖色强调"],
                typographyTerms: ["粗体无衬线"],
                moodTerms: ["现代", "专业"],
                reusablePromptPatterns: ["大标题优先"],
                reusablePatterns: ["大标题优先", "单一视觉焦点"],
                avoidPatterns: ["文字不可读", "信息过密"]
              })
            }
          }
        ]
      })
    };
  }
});

assert.equal(dashScopeCalls[0].url, "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
assert.equal(dashScopeCalls[0].options.headers.authorization, "Bearer dashscope-test-key");
assert.equal(dashScopeAnalysis.referenceId, "ref-test");
assert.equal(dashScopeAnalysis.usageCategory, "活动海报");
