import assert from "node:assert/strict";
import { adaptPromptTemplate, buildPromptPackageText, modelAdapters } from "../src/promptAdapters.js";

const basePrompt = {
  scenario: "校园活动海报",
  goal: "AI 创作分享会",
  prompt: "为 AI 创作分享会生成一张竖版校园活动海报。使用清晰层级、干净网格和醒目可读标题。",
  negativePrompt: "文字不可读，画面拥挤，字体混乱",
  keyPromptTerms: ["清晰层级", "干净网格", "醒目标题"]
};

assert.deepEqual(
  modelAdapters.map((adapter) => adapter.id),
  ["generic", "midjourney", "dalle", "stable-diffusion", "jimeng", "wanxiang", "doubao"]
);

const generic = adaptPromptTemplate(basePrompt, "generic");
assert.equal(generic.label, "通用提示词");
assert.equal(generic.prompt, basePrompt.prompt);
assert.equal(generic.negativePrompt, basePrompt.negativePrompt);

const midjourney = adaptPromptTemplate(basePrompt, "midjourney");
assert.equal(midjourney.label, "Midjourney");
assert.match(midjourney.prompt, /--ar 3:4/);
assert.match(midjourney.prompt, /--style raw/);

const dalle = adaptPromptTemplate(basePrompt, "dalle");
assert.equal(dalle.label, "DALL-E");
assert.match(dalle.prompt, /生成一张完整的平面海报/);
assert.match(dalle.prompt, /不要生成不可读的小字/);

const stableDiffusion = adaptPromptTemplate(basePrompt, "stable-diffusion");
assert.equal(stableDiffusion.label, "Stable Diffusion");
assert.match(stableDiffusion.prompt, /高质量平面海报设计/);
assert.equal(stableDiffusion.negativePrompt, basePrompt.negativePrompt);

const jimeng = adaptPromptTemplate(basePrompt, "jimeng");
assert.equal(jimeng.label, "即梦");
assert.match(jimeng.prompt, /中文海报设计/);
assert.match(jimeng.prompt, /保留可编辑标题区域/);

const wanxiang = adaptPromptTemplate(basePrompt, "wanxiang");
assert.equal(wanxiang.label, "通义万相");
assert.match(wanxiang.prompt, /画面主体/);
assert.match(wanxiang.prompt, /视觉风格/);

const doubao = adaptPromptTemplate(basePrompt, "doubao");
assert.equal(doubao.label, "豆包生图");
assert.match(doubao.prompt, /请生成一张/);
assert.match(doubao.prompt, /不要把文字画糊/);

const packageText = buildPromptPackageText(jimeng);
assert.match(packageText, /适用场景：校园活动海报/);
assert.match(packageText, /推荐格式：即梦/);
assert.match(packageText, /正向提示词：/);
assert.match(packageText, /负向提示词：/);
assert.match(packageText, /关键词：清晰层级、干净网格、醒目标题/);

assert.throws(() => adaptPromptTemplate(basePrompt, "unknown-model"), /Unknown prompt adapter/);
