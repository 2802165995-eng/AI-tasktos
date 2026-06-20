export async function copyTextToClipboard(text, environment = globalThis) {
  try {
    await environment.navigator?.clipboard?.writeText(text);
    return "clipboard";
  } catch {
    // Fall through to the textarea fallback below.
  }

  const documentRef = environment.document;
  if (!documentRef?.createElement || !documentRef.body || !documentRef.execCommand) {
    throw new Error("当前浏览器不允许自动复制，请手动选择文本复制。");
  }

  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  documentRef.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = documentRef.execCommand("copy");
    if (!copied) {
      throw new Error("当前浏览器不允许自动复制，请手动选择文本复制。");
    }
    return "fallback";
  } finally {
    textarea.remove();
  }
}
