import assert from "node:assert/strict";
import { generateAnalysis, generatePromptTemplate, generateTasteProfile } from "../src/tasteEngine.js";

const reference = {
  id: "ref-ai",
  title: "AI Design Workshop",
  category: "event_poster",
  userNote: "喜欢科技感、清晰标题和低噪音。",
  createdAt: "2026-06-14T00:00:00.000Z"
};

const analysis = generateAnalysis(reference);

assert.equal(analysis.referenceId, "ref-ai");
assert.equal(analysis.usageScenario, "活动海报");
assert.ok(analysis.moodTags.includes("科技"));
assert.ok(analysis.reusablePatterns.includes("大标题优先"));
assert.ok(analysis.avoidPatterns.includes("文字不可读"));
assert.match(analysis.inferredPrompt, /生成一张/);
assert.ok(analysis.keyPromptTerms.includes("醒目可读标题"));
assert.ok(analysis.negativePromptTerms.includes("文字不可读"));
assert.equal(analysis.usageCategory, "活动海报");
assert.ok(analysis.styleCategory);
assert.ok(analysis.compositionTerms.length > 0);
assert.ok(analysis.colorTerms.length > 0);

const profile = generateTasteProfile([{ ...reference, analysisId: analysis.id }], [analysis], [
  {
    feedbackTags: ["text_unreadable", "too_cluttered"]
  }
]);

assert.deepEqual(profile.evidenceReferenceIds, ["ref-ai"]);
assert.ok(profile.layoutPreferences.includes("大标题优先"));
assert.ok(profile.negativePreferences.includes("文字不可读"));
assert.ok(profile.negativePreferences.includes("画面太杂乱"));

const prompt = generatePromptTemplate({
  scenario: "校园活动海报",
  goal: "AI 视觉创作分享会",
  profile,
  references: [{ ...reference, analysisId: analysis.id }]
});

assert.equal(prompt.scenario, "校园活动海报");
assert.equal(prompt.goal, "AI 视觉创作分享会");
assert.match(prompt.prompt, /AI 视觉创作分享会/);
assert.match(prompt.negativePrompt, /文字不可读/);
