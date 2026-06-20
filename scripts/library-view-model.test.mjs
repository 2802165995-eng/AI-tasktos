import assert from "node:assert/strict";
import { buildLibraryViewModel } from "../src/libraryViewModel.js";

const references = Array.from({ length: 12 }, (_, index) => ({
  id: `ref-${index + 1}`,
  title: `Reference ${index + 1}`
}));

const collapsed = buildLibraryViewModel(references, { expanded: false, previewCount: 4 });
assert.equal(collapsed.visibleReferences.length, 4);
assert.equal(collapsed.hiddenCount, 8);
assert.equal(collapsed.toggleLabel, "展开全部 12 张案例");
assert.equal(collapsed.isCollapsed, true);

const expanded = buildLibraryViewModel(references, { expanded: true, previewCount: 4 });
assert.equal(expanded.visibleReferences.length, 12);
assert.equal(expanded.hiddenCount, 0);
assert.equal(expanded.toggleLabel, "收起案例库");
assert.equal(expanded.isCollapsed, false);

const shortList = buildLibraryViewModel(references.slice(0, 3), { expanded: false, previewCount: 4 });
assert.equal(shortList.visibleReferences.length, 3);
assert.equal(shortList.hiddenCount, 0);
assert.equal(shortList.toggleLabel, "");
