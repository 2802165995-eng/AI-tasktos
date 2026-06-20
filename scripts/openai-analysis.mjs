export const visualAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    inferredPrompt: { type: "string" },
    keyPromptTerms: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 16
    },
    negativePromptTerms: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 12
    },
    usageCategory: { type: "string" },
    styleCategory: { type: "string" },
    compositionTerms: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    colorTerms: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    typographyTerms: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    moodTerms: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    reusablePromptPatterns: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    composition: { type: "string" },
    colorPalette: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6
    },
    colorDescription: { type: "string" },
    typography: { type: "string" },
    informationHierarchy: { type: "string" },
    moodTags: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    styleTags: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    usageScenario: { type: "string" },
    reusablePatterns: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    },
    avoidPatterns: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 8
    }
  },
  required: [
    "inferredPrompt",
    "keyPromptTerms",
    "negativePromptTerms",
    "usageCategory",
    "styleCategory",
    "compositionTerms",
    "colorTerms",
    "typographyTerms",
    "moodTerms",
    "reusablePromptPatterns",
    "composition",
    "colorPalette",
    "colorDescription",
    "typography",
    "informationHierarchy",
    "moodTags",
    "styleTags",
    "usageScenario",
    "reusablePatterns",
    "avoidPatterns"
  ]
};

export function validateAnalysisRequest(payload) {
  if (!payload || typeof payload !== "object") return "Request body must be a JSON object";
  if (!String(payload.id || "").trim()) return "id is required";
  if (!payload.imageUrl && !payload.imageBase64) return "imageUrl or imageBase64 is required";
  return null;
}

export function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 8 * 1024 * 1024) {
        reject(new Error("Request body is too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

export function buildOpenAIAnalysisRequest(reference, options = {}) {
  const model = options.model;
  const imageInput = reference.imageBase64 || reference.imageUrl;

  return {
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "你是 TasteOS 的视觉分析引擎。",
              "请分析这张平面设计、海报或社媒视觉参考图。",
              "请自动识别图片用途、视觉风格，以及用户可能喜欢的偏好线索。",
              "先反推如果要生成这张图可能会使用的中文生图提示词，再提取可复用的提示词基因。",
              "提示词基因包括用途分类、风格分类、构图词、色彩词、字体词、情绪词、关键提示词和负向提示词。",
              "不要评价好坏，只提取可以复用到生图提示词里的视觉偏好。",
              "所有字段的值必须使用中文，包括 inferredPrompt、keyPromptTerms、negativePromptTerms、usageCategory、styleCategory 和所有标签数组。",
              "不要输出英文提示词，不要输出英文分类。必要的 JSON 字段名可以保持英文，但字段值必须中文。",
              `可选标题：${reference.title || "未提供，请根据图片自动概括"}`,
              `可选分类：${reference.category || "未提供，请根据图片自动识别"}`,
              `可选用户备注：${reference.userNote || "未提供，请根据图片自动推断偏好"}`
            ].join("\n")
          },
          {
            type: "input_image",
            image_url: imageInput,
            detail: "auto"
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "tasteos_visual_analysis",
        strict: true,
        schema: visualAnalysisSchema
      }
    }
  };
}

export async function createApiAnalysis(reference, options = {}) {
  const provider = String(options.provider || "openai").trim().toLowerCase();
  if (provider === "dashscope") {
    return createDashScopeApiAnalysis(reference, options);
  }

  const apiKey = options.apiKey;
  const model = options.model;
  const fetchImpl = options.fetchImpl || fetch;

  if (!apiKey) {
    throw new Error("请在 .env.local 中配置 OPENAI_API_KEY");
  }

  if (!model) {
    throw new Error("请在 .env.local 中配置 OPENAI_MODEL");
  }

  const validationError = validateAnalysisRequest(reference);
  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(buildOpenAIAnalysisRequest(reference, { model }))
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error?.message || `OpenAI request failed with status ${response.status}`);
  }

  const outputText = body.output_text || body.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text;
  if (!outputText) {
    throw new Error("OpenAI 响应缺少 output_text");
  }

  let analysis;
  try {
    analysis = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI 响应不是有效 JSON");
  }

  return {
    id: `analysis-${reference.id}`,
    referenceId: reference.id,
    ...analysis
  };
}

export function buildDashScopeAnalysisRequest(reference, options = {}) {
  const model = options.model;
  const imageInput = reference.imageBase64 || reference.imageUrl;

  return {
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "你是 TasteOS 的提示词基因分析引擎。",
              "请分析这张平面设计、海报或社媒视觉参考图。",
              "请自动识别图片用途、视觉风格，以及用户可能喜欢的偏好线索。",
              "先反推如果要生成这张图可能会使用的中文生图提示词，再提取可复用的提示词基因。",
              "只返回一个 JSON 对象，不要返回 Markdown，不要包裹代码块。",
              "所有字段的值必须使用中文，包括 inferredPrompt、keyPromptTerms、negativePromptTerms、usageCategory、styleCategory 和所有标签数组。",
              "不要输出英文提示词，不要输出英文分类。必要的 JSON 字段名可以保持英文，但字段值必须中文。",
              "JSON 必须包含这些字段：inferredPrompt, keyPromptTerms, negativePromptTerms, usageCategory, styleCategory, compositionTerms, colorTerms, typographyTerms, moodTerms, reusablePromptPatterns, composition, colorPalette, colorDescription, typography, informationHierarchy, moodTags, styleTags, usageScenario, reusablePatterns, avoidPatterns。",
              `可选标题：${reference.title || "未提供，请根据图片自动概括"}`,
              `可选分类：${reference.category || "未提供，请根据图片自动识别"}`,
              `可选用户备注：${reference.userNote || "未提供，请根据图片自动推断偏好"}`
            ].join("\n")
          },
          {
            type: "image_url",
            image_url: {
              url: imageInput
            }
          }
        ]
      }
    ]
  };
}

async function createDashScopeApiAnalysis(reference, options = {}) {
  const apiKey = options.dashScopeApiKey;
  const model = options.dashScopeModel;
  const baseUrl = (options.dashScopeBaseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
  const fetchImpl = options.fetchImpl || fetch;

  if (!apiKey) {
    throw new Error("请在 .env.local 中配置 DASHSCOPE_API_KEY");
  }

  if (!model) {
    throw new Error("请在 .env.local 中配置 DASHSCOPE_MODEL");
  }

  const validationError = validateAnalysisRequest(reference);
  if (validationError) {
    throw new Error(validationError);
  }

  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(buildDashScopeAnalysisRequest(reference, { model }))
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error?.message || body.message || `DashScope request failed with status ${response.status}`);
  }

  const outputText = body.choices?.[0]?.message?.content;
  if (!outputText) {
    throw new Error("DashScope 响应缺少 message content");
  }

  const analysis = parseAnalysisJson(outputText);

  return {
    id: `analysis-${reference.id}`,
    referenceId: reference.id,
    ...analysis
  };
}

function parseAnalysisJson(outputText) {
  const trimmed = String(outputText).trim();
  const withoutFence = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const objectStart = withoutFence.indexOf("{");
  const objectEnd = withoutFence.lastIndexOf("}");
  const jsonText = objectStart >= 0 && objectEnd >= objectStart ? withoutFence.slice(objectStart, objectEnd + 1) : withoutFence;

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error("模型返回的提示词基因 JSON 无法解析");
  }
}
