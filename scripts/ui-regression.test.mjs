import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

for (const hook of [
  "data-reference-form",
  "data-image-url-input",
  "data-image-file-input",
  "data-analysis-mode",
  "analysis-hero",
  "analysis-details",
]) {
  assert.match(appSource, new RegExp(hook), `missing upload hook: ${hook}`);
}

for (const view of ["library", "profile", "prompt", "feedback", "about"]) {
  assert.match(appSource, new RegExp(`\\["${view}"`), `missing navigation view: ${view}`);
}
assert.match(appSource, /function renderNavIcon/, "navigation should use reference-style line icons");
assert.match(appSource, /brand-divider/, "header should use the approved horizontal brand lockup");

assert.match(
  cssSource,
  /@media\s*\(max-width:\s*1279px\)[\s\S]*?\.config-sidebar\s*\{\s*display:\s*block;/,
  "PC responsive CSS must explicitly keep the upload/configuration panel visible",
);

assert.match(
  cssSource,
  /\.workbench\.library-workbench\s*\{[\s\S]*?grid-template-columns:\s*72px|grid-template-columns:\s*320px/,
  "desktop workbench should use production-scale panel dimensions",
);

assert.match(cssSource, /--topbar-height:\s*64px/, "reference baseline requires a 64px topbar");
assert.match(cssSource, /--rail-width:\s*96px/, "reference baseline requires a 96px workflow rail");
assert.match(cssSource, /--library-width:\s*332px/, "reference baseline requires a 332px library");
assert.match(cssSource, /--config-width:\s*324px/, "reference baseline requires a 324px configuration panel");
assert.match(
  cssSource,
  /grid-template-columns:\s*var\(--library-width\)\s+minmax\(600px,\s*1fr\)\s+var\(--config-width\)/,
  "workbench must use tokenized stable side panels and a flexible analysis canvas",
);
assert.match(cssSource, /:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--accent\)/, "missing shared focus-visible ring");
assert.match(cssSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, "missing reduced-motion handling");
assert.match(
  cssSource,
  /@media\s*\(max-width:\s*1279px\)[\s\S]*?--library-width:\s*260px[\s\S]*?--config-width:\s*260px/,
  "1280-class layout should compress both side panels without hiding upload",
);
assert.match(
  cssSource,
  /\.analysis-canvas\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/,
  "analysis canvas should be a full-height column",
);
assert.match(
  cssSource,
  /\.analysis-canvas\s*>\s*\.current-analysis-card\s*\{[\s\S]*?flex:\s*1;/,
  "current analysis card should fill the remaining workbench height",
);
assert.match(
  cssSource,
  /\.analysis-summary h2\s*\{[\s\S]*?font-size:\s*28px;/,
  "analysis title should use the enlarged reading scale",
);
assert.match(
  cssSource,
  /\.analysis-summary\s*>\s*\.muted\s*\{[\s\S]*?font-size:\s*15px;/,
  "analysis summary copy should be enlarged",
);
assert.match(
  cssSource,
  /\.analysis-preview-media\s*\{[\s\S]*?aspect-ratio:\s*3\s*\/\s*4;/,
  "analysis image stage should match the approved portrait proportion",
);
assert.match(
  cssSource,
  /\.analysis-preview-media\s+\.poster-preview\s*\{[\s\S]*?object-fit:\s*cover;/,
  "analysis image should fill the approved stage without letterboxing",
);
assert.match(
  cssSource,
  /\.analysis-hero\s*\{[\s\S]*?grid-template-columns:\s*minmax\(250px,\s*40%\)\s+minmax\(0,\s*1fr\)/,
  "analysis hero should match the approved image-left summary-right composition",
);
assert.match(
  cssSource,
  /\.analysis-details\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1;/,
  "analysis details should span the full card width below the hero",
);

console.log("ui regression checks passed");
