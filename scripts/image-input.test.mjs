import assert from "node:assert/strict";
import { findClipboardImageFile, readImageFileAsDataUrl, validateImageFile } from "../src/imageInput.js";

const pngFile = { name: "clipboard.png", type: "image/png", size: 1024 };
const textFile = { name: "notes.txt", type: "text/plain", size: 50 };

assert.equal(
  findClipboardImageFile({
    items: [
      { type: "text/plain", getAsFile: () => textFile },
      { type: "image/png", getAsFile: () => pngFile }
    ]
  }),
  pngFile
);

assert.equal(findClipboardImageFile({ items: [] }), null);
assert.equal(validateImageFile(pngFile), null);
assert.match(validateImageFile({ ...pngFile, type: "image/gif" }), /JPEG、PNG 或 WebP/);
assert.match(validateImageFile({ ...pngFile, size: 3 * 1024 * 1024 + 1 }), /3 MB/);

const dataUrl = await readImageFileAsDataUrl({
  type: "image/png",
  async arrayBuffer() {
    return Uint8Array.from([137, 80, 78, 71]).buffer;
  }
});
assert.equal(dataUrl, "data:image/png;base64,iVBORw==");

await assert.rejects(
  () =>
    readImageFileAsDataUrl({
      type: "image/png",
      async arrayBuffer() {
        return new ArrayBuffer(0);
      }
    }),
  /图片内容为空/
);
