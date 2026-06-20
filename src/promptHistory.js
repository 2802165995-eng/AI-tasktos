export function buildPromptHistoryItems(prompts) {
  return [...prompts]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((prompt) => ({
      id: prompt.id,
      title: `${prompt.scenario} - ${prompt.goal}`,
      adapterLabel: prompt.adapterLabel || "通用 Prompt",
      createdLabel: formatDate(prompt.createdAt),
      prompt
    }));
}

export function removePromptById(prompts, promptId) {
  return prompts.filter((prompt) => prompt.id !== promptId);
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "未知时间";
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
