export function buildLibraryViewModel(references, options = {}) {
  const previewCount = options.previewCount ?? 4;
  const expanded = Boolean(options.expanded);
  const visibleReferences = expanded ? references : references.slice(0, previewCount);
  const hiddenCount = Math.max(0, references.length - visibleReferences.length);

  return {
    visibleReferences,
    hiddenCount,
    isCollapsed: hiddenCount > 0,
    toggleLabel: references.length > previewCount ? (expanded ? "收起案例库" : `展开全部 ${references.length} 张案例`) : ""
  };
}
