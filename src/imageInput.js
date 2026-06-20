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

export async function readImageFileAsDataUrl(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) {
    throw new Error("图片内容为空。");
  }

  let binary = "";
  const chunkSize = 32 * 1024;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return `data:${file.type};base64,${btoa(binary)}`;
}
