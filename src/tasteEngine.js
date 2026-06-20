const categoryLabels = {
  event_poster: "活动海报",
  social_cover: "社媒封面",
  portfolio_cover: "项目封面"
};

export function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function generateAnalysis(reference) {
  const titleAndNote = `${reference.title} ${reference.userNote || ""}`.toLowerCase();
  const isPortfolio = reference.category === "portfolio_cover";
  const isSocial = reference.category === "social_cover";
  const isRetro = /retro|复古|vintage|胶片/.test(titleAndNote);
  const isTech = /ai|tech|科技|未来/.test(titleAndNote);

  const moodTags = isPortfolio
    ? ["克制", "高级", "编辑感"]
    : isSocial
      ? ["直接", "年轻", "有冲击力"]
      : isTech
        ? ["科技", "冷静", "专业"]
        : isRetro
          ? ["复古", "温暖", "怀旧"]
          : ["清晰", "现代", "传播感"];

  const colorPalette = isPortfolio
    ? ["#f8f6f1", "#171717", "#c8b6a6"]
    : isTech
      ? ["#0f172a", "#38bdf8", "#f8fafc"]
      : isRetro
        ? ["#2b1d12", "#d89855", "#f7e4bd"]
      : ["#111827", "#e95034", "#fef3c7"];

  const usageCategory = isPortfolio ? "作品集封面" : isSocial ? "社媒封面" : "活动海报";
  const styleCategory = isPortfolio ? "编辑感极简" : isTech ? "科技海报" : isRetro ? "复古编辑风" : "强视觉活动";
  const compositionTerms = isPortfolio ? ["大面积留白", "网格排版", "编辑封面"] : ["单一视觉焦点", "大标题优先", "高对比版式"];
  const colorTerms = isPortfolio ? ["中性色调", "低饱和", "暖纸感底色"] : isTech ? ["深色背景", "冷蓝强调色", "高对比"] : ["深色底", "暖色强调", "海报对比"];
  const typographyTerms = ["醒目可读标题", "清晰层级", "无衬线辅助文字"];
  const moodTerms = isPortfolio ? ["冷静", "克制", "编辑感"] : isTech ? ["现代", "专注", "专业"] : ["有能量", "直接", "传播感"];
  const keyPromptTerms = unique([...compositionTerms, ...colorTerms, ...typographyTerms, ...moodTerms]).slice(0, 12);
  const negativePromptTerms = ["文字不可读", "画面拥挤", "字体混乱", "对比度过低", "装饰随机"];
  const inferredPrompt = [
    `生成一张${usageCategory || "平面视觉"}。`,
    `构图使用${compositionTerms.slice(0, 2).join("、")}。`,
    `色彩方向为${colorTerms.slice(0, 3).join("、")}。`,
    `字体方向为${typographyTerms.join("、")}。`,
    `整体情绪是${moodTerms.join("、")}。`
  ].join("");

  return {
    id: `analysis-${reference.id}`,
    referenceId: reference.id,
    inferredPrompt,
    keyPromptTerms,
    negativePromptTerms,
    usageCategory,
    styleCategory,
    compositionTerms,
    colorTerms,
    typographyTerms,
    moodTerms,
    reusablePromptPatterns: compositionTerms,
    composition: isPortfolio
      ? "留白明确，适合用网格和标题层级建立作品集入口。"
      : isSocial
        ? "主视觉需要快速抓住注意，适合强标题和高对比布局。"
        : "信息需要按标题、时间地点、行动引导组织，适合活动传播。",
    colorPalette,
    colorDescription: isPortfolio
      ? "低饱和中性色，强调克制、安静和编辑感。"
      : isTech
        ? "冷色科技感，高明度文字适合形成强对比。"
        : "深色背景搭配强调色，形成较强视觉冲击。",
    typography: "适合使用可读性强的标题字体，辅助信息保持清晰层级。",
    informationHierarchy: "标题应是第一视觉层级，辅助信息控制在两层以内。",
    moodTags,
    styleTags: isPortfolio ? ["留白", "网格", "低饱和"] : ["大标题", "高对比", "强视觉焦点"],
    usageScenario: categoryLabels[reference.category],
    reusablePatterns: isPortfolio
      ? ["大面积留白", "网格对齐", "低饱和配色"]
      : ["大标题优先", "单一视觉焦点", "少量强调色"],
    avoidPatterns: ["文字不可读", "信息过密", "装饰过多"]
  };
}

export function generateTasteProfile(references, analyses, feedback = []) {
  const negativeFromFeedback = feedback.flatMap((item) => {
    const tags = [];
    if (item.feedbackTags?.includes("too_cluttered")) tags.push("画面太杂乱");
    if (item.feedbackTags?.includes("text_unreadable")) tags.push("文字不可读");
    if (item.feedbackTags?.includes("wrong_mood")) tags.push("情绪偏离目标");
    if (item.feedbackTags?.includes("color_mismatch")) tags.push("色彩不符合偏好");
    if (item.feedbackTags?.includes("layout_mismatch")) tags.push("构图不符合偏好");
    return tags;
  });

  return {
    id: "profile-current",
    layoutPreferences: unique(analyses.flatMap((analysis) => analysis.reusablePatterns)).slice(0, 6),
    colorPreferences: unique(analyses.map((analysis) => analysis.colorDescription)).slice(0, 5),
    typographyPreferences: unique(analyses.map((analysis) => analysis.typography)).slice(0, 4),
    moodPreferences: unique(analyses.flatMap((analysis) => analysis.moodTags)).slice(0, 8),
    informationDensity: "medium",
    negativePreferences: unique([...analyses.flatMap((analysis) => analysis.avoidPatterns), ...negativeFromFeedback]),
    evidenceReferenceIds: references.map((reference) => reference.id),
    updatedAt: new Date().toISOString()
  };
}

export function generatePromptTemplate({ scenario, goal, profile, references }) {
  const layout = profile.layoutPreferences.slice(0, 3).join("、");
  const mood = profile.moodPreferences.slice(0, 4).join("、");
  const color = profile.colorPreferences[0] || "高对比但克制的色彩方案";

  return {
    id: `prompt-${Date.now()}`,
    scenario,
    goal,
    prompt: [
      `为“${goal}”生成一张竖版${scenario}。`,
      `请延续我的个人审美画像：${layout}。`,
      `色彩方向：${color}。`,
      "标题需要醒目可读，辅助文字保持清晰层级。",
      "构图需要让主题在一秒内被识别。",
      `情绪关键词：${mood}。`,
      "请为标题、副标题、时间地点和行动引导预留清晰区域。",
      "整体应该有明确设计意图，适合作为海报或社媒视觉使用。"
    ].join(" "),
    negativePrompt:
      "文字不可读，画面过度拥挤，装饰过多，随机视觉元素，对比度过低，字体混乱，文字变形",
    keyPromptTerms: [
      ...profile.layoutPreferences.slice(0, 3),
      ...profile.moodPreferences.slice(0, 3),
      "醒目可读标题",
      "清晰信息层级"
    ],
    basedOnProfileId: profile.id,
    basedOnReferenceIds: references.map((reference) => reference.id),
    createdAt: new Date().toISOString()
  };
}
