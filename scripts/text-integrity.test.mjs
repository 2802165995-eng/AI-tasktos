import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  "README.md",
  "docs/demo/tasteos-demo-script.md",
  "docs/interview/tasteos-resume-bullets.md",
  "docs/interview/tasteos-defense-qa.md",
  "docs/interview/tasteos-project-story.md",
  "index.html",
  "src/app.js",
  "src/tasteEngine.js",
  "scripts/openai-analysis.mjs"
];
const mojibakePatterns = [/娑/, /閹/, /閻/, /鈧/, /\?\?\?/, /[\u0600-\u06FF]/];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of mojibakePatterns) {
    assert.equal(pattern.test(text), false, `${file} contains mojibake pattern ${pattern}`);
  }
}

const appText = fs.readFileSync("src/app.js", "utf8");
assert.match(appText, /个人审美提示词工坊/);
assert.match(appText, /离线演示分析/);
assert.match(appText, /真实模型分析/);
assert.match(appText, /正在调用真实模型分析图片/);
assert.match(appText, /已回退到离线演示分析/);
assert.match(appText, /已复制提示词/);
assert.doesNotMatch(appText, /Prompt DNA|Prompt Studio|Local upload|User input|离线 Demo 分析/);
