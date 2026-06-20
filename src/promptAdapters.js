export const modelAdapters = [
  {
    id: "generic",
    label: "通用提示词",
    description: "适合复制到大多数 AI 生图工具，保留完整创作约束。"
  },
  {
    id: "midjourney",
    label: "Midjourney",
    description: "保留中文主体描述，并追加画幅和风格参数。"
  },
  {
    id: "dalle",
    label: "DALL-E",
    description: "改写为更自然的中文指令，强调可读文字区域和版面约束。"
  },
  {
    id: "stable-diffusion",
    label: "Stable Diffusion",
    description: "拆成正向提示词和负向提示词，适合本地模型工作流。"
  },
  {
    id: "jimeng",
    label: "即梦",
    description: "偏中文短句与视觉结果描述，适合快速生成海报方向稿。"
  },
  {
    id: "wanxiang",
    label: "通义万相",
    description: "按主体、风格、构图、文字区域组织，适合结构化生图。"
  },
  {
    id: "doubao",
    label: "豆包生图",
    description: "使用更口语化的中文创作要求，强调不要把文字画糊。"
  }
];

export function adaptPromptTemplate(template, adapterId) {
  const adapter = modelAdapters.find((item) => item.id === adapterId);

  if (!adapter) {
    throw new Error(`Unknown prompt adapter: ${adapterId}`);
  }

  const base = {
    ...adapter,
    scenario: template.scenario,
    goal: template.goal,
    keyPromptTerms: template.keyPromptTerms || [],
    negativePrompt: template.negativePrompt
  };

  if (adapterId === "midjourney") {
    return {
      ...base,
      prompt: `${template.prompt} --ar 3:4 --style raw --v 6`
    };
  }

  if (adapterId === "dalle") {
    return {
      ...base,
      prompt: [
        "请根据以下创作方向生成一张完整的平面海报。",
        template.prompt,
        "不要生成不可读的小字，文字区域要清晰、干净、有层级。",
        "画面应像完成度较高的海报设计，而不是松散插画。"
      ].join(" ")
    };
  }

  if (adapterId === "stable-diffusion") {
    return {
      ...base,
      prompt: `高质量平面海报设计，专业视觉设计，${template.prompt}`
    };
  }

  if (adapterId === "jimeng") {
    return {
      ...base,
      prompt: [
        "中文海报设计，竖版构图，保留可编辑标题区域。",
        template.prompt,
        "画面要有明确主视觉、干净背景、清晰信息层级，适合直接作为海报方向稿。"
      ].join(" ")
    };
  }

  if (adapterId === "wanxiang") {
    return {
      ...base,
      prompt: [
        `画面主体：${template.goal || "主题视觉"}`,
        `使用场景：${template.scenario || "平面海报"}`,
        `视觉风格：${template.prompt}`,
        "构图要求：主标题区域清晰，辅助信息分层排列，主体和留白比例稳定。",
        "输出效果：完整平面设计稿，适合继续排版和二次修改。"
      ].join("；")
    };
  }

  if (adapterId === "doubao") {
    return {
      ...base,
      prompt: [
        `请生成一张${template.scenario || "平面海报"}，主题是${template.goal || "视觉活动"}`,
        template.prompt,
        "不要把文字画糊，不要出现乱码，标题区域要醒目，整体像真实设计师做出的海报。"
      ].join("。")
    };
  }

  return {
    ...base,
    prompt: template.prompt
  };
}

export function buildPromptPackageText(promptDraft) {
  const keyTerms = (promptDraft.keyPromptTerms || []).join("、") || "无";

  return [
    `适用场景：${promptDraft.scenario || "未指定"}`,
    `推荐格式：${promptDraft.adapterLabel || promptDraft.label || "通用提示词"}`,
    "",
    "正向提示词：",
    promptDraft.prompt,
    "",
    "负向提示词：",
    promptDraft.negativePrompt,
    "",
    `关键词：${keyTerms}`
  ].join("\n");
}
