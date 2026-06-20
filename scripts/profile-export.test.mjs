import assert from "node:assert/strict";
import { exportTasteProfileMarkdown } from "../src/profileExport.js";

const profile = {
  layoutPreferences: ["大标题优先", "网格对齐"],
  colorPreferences: ["高对比", "低饱和中性色"],
  typographyPreferences: ["粗体无衬线标题"],
  moodPreferences: ["克制", "专业"],
  negativePreferences: ["文字不可读", "信息过密"],
  updatedAt: "2026-06-14T00:00:00.000Z"
};

const references = [
  {
    id: "ref-1",
    title: "Campus AI Talk Poster",
    category: "event_poster",
    userNote: "喜欢清晰标题。"
  }
];

const markdown = exportTasteProfileMarkdown(profile, references);

assert.match(markdown, /^# Taste Profile/m);
assert.match(markdown, /## 版式偏好/);
assert.match(markdown, /- 大标题优先/);
assert.match(markdown, /## 色彩偏好/);
assert.match(markdown, /## 证据案例/);
assert.match(markdown, /Campus AI Talk Poster/);
assert.match(markdown, /## 需要避免/);
assert.match(markdown, /- 文字不可读/);
