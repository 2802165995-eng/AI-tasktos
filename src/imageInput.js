const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export function findClipboardImageFile(clipboardData) {
  for (const item of clipboardData?.items || []) {
    if (!String(item.type || "").startsWith("image/")) continue;
    const file = item.getAsFile?.();
    if (file) return file;
  }
  return null;
}

export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file?.type)) {
    return "仅支持 JPEG、PNG 或 WebP 图片。";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "图片不能超过 3 MB。";
  }
  return null;
}
