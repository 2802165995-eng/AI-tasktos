export function deleteReferenceFromState(state, referenceId) {
  const target = state.references.find((reference) => reference.id === referenceId);
  if (!target) return state;

  const references = state.references.filter((reference) => reference.id !== referenceId);
  const analyses = state.analyses.filter((analysis) => analysis.id !== target.analysisId && analysis.referenceId !== referenceId);
  const selectedReferenceId = state.selectedReferenceId === referenceId ? references[0]?.id || null : state.selectedReferenceId;

  return {
    ...state,
    references,
    analyses,
    selectedReferenceId
  };
}
