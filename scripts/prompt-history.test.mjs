import assert from "node:assert/strict";
import { buildPromptHistoryItems, removePromptById } from "../src/promptHistory.js";

const prompts = [
  {
    id: "older",
    scenario: "社媒封面",
    goal: "AI 工具分享",
    adapterLabel: "DALL·E",
    createdAt: "2026-06-14T00:00:00.000Z"
  },
  {
    id: "newer",
    scenario: "校园活动海报",
    goal: "AI 视觉创作分享会",
    adapterLabel: "Midjourney",
    createdAt: "2026-06-14T01:00:00.000Z"
  }
];

const historyItems = buildPromptHistoryItems(prompts);

assert.equal(historyItems.length, 2);
assert.equal(historyItems[0].id, "newer");
assert.equal(historyItems[0].title, "校园活动海报 - AI 视觉创作分享会");
assert.equal(historyItems[0].adapterLabel, "Midjourney");
assert.match(historyItems[0].createdLabel, /2026/);
assert.equal(historyItems[1].id, "older");

const remaining = removePromptById(prompts, "newer");
assert.deepEqual(
  remaining.map((prompt) => prompt.id),
  ["older"]
);

const unchanged = removePromptById(prompts, "missing");
assert.deepEqual(
  unchanged.map((prompt) => prompt.id),
  ["older", "newer"]
);
