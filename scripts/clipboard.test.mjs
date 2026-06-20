import assert from "node:assert/strict";
import { copyTextToClipboard } from "../src/clipboard.js";

let clipboardText = "";
const clipboardEnvironment = {
  navigator: {
    clipboard: {
      writeText: async (text) => {
        clipboardText = text;
      }
    }
  }
};

assert.equal(await copyTextToClipboard("正向提示词", clipboardEnvironment), "clipboard");
assert.equal(clipboardText, "正向提示词");

let appendedNode = null;
let removed = false;
const fallbackEnvironment = {
  navigator: {
    clipboard: {
      writeText: async () => {
        throw new Error("denied");
      }
    }
  },
  document: {
    body: {
      appendChild: (node) => {
        appendedNode = node;
      }
    },
    createElement: () => ({
      value: "",
      style: {},
      setAttribute: () => {},
      select: () => {},
      remove: () => {
        removed = true;
      }
    }),
    execCommand: (command) => command === "copy"
  }
};

assert.equal(await copyTextToClipboard("完整提示词包", fallbackEnvironment), "fallback");
assert.equal(appendedNode.value, "完整提示词包");
assert.equal(removed, true);

await assert.rejects(
  () => copyTextToClipboard("无法复制", { navigator: { clipboard: { writeText: async () => { throw new Error("denied"); } } } }),
  /不允许自动复制/
);
