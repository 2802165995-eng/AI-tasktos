const categoryLabels = {
  event_poster: "活动海报",
  social_cover: "社媒封面",
  portfolio_cover: "项目封面"
};

export function exportTasteProfileMarkdown(profile, references) {
  const sections = [
    "# Taste Profile",
    "",
    `更新时间：${formatDate(profile.updatedAt)}`,
    "",
    listSection("版式偏好", profile.layoutPreferences),
    listSection("色彩偏好", profile.colorPreferences),
    listSection("字体偏好", profile.typographyPreferences),
    listSection("情绪偏好", profile.moodPreferences),
    listSection("需要避免", profile.negativePreferences),
    referenceSection(references)
  ];

  return sections.filter(Boolean).join("\n");
}

function listSection(title, items) {
  if (!items || items.length === 0) {
    return "";
  }

  return [`## ${title}`, "", ...items.map((item) => `- ${item}`), ""].join("\n");
}

function referenceSection(references) {
  if (!references || references.length === 0) {
    return "";
  }

  return [
    "## 证据案例",
    "",
    ...references.map((reference) => {
      const category = categoryLabels[reference.category] || reference.category;
      const note = reference.userNote ? `：${reference.userNote}` : "";
      return `- ${reference.title}（${category}）${note}`;
    }),
    ""
  ].join("\n");
}

function formatDate(value) {
  if (!value) {
    return "未知";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
