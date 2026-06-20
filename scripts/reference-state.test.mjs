import assert from "node:assert/strict";
import { deleteReferenceFromState } from "../src/referenceState.js";

const state = {
  selectedReferenceId: "ref-1",
  references: [
    { id: "ref-1", analysisId: "analysis-ref-1" },
    { id: "ref-2", analysisId: "analysis-ref-2" }
  ],
  analyses: [
    { id: "analysis-ref-1", referenceId: "ref-1" },
    { id: "analysis-ref-2", referenceId: "ref-2" }
  ]
};

const next = deleteReferenceFromState(state, "ref-1");

assert.deepEqual(
  next.references.map((reference) => reference.id),
  ["ref-2"]
);
assert.deepEqual(
  next.analyses.map((analysis) => analysis.id),
  ["analysis-ref-2"]
);
assert.equal(next.selectedReferenceId, "ref-2");

const unchanged = deleteReferenceFromState(state, "missing");
assert.equal(unchanged, state);

const empty = deleteReferenceFromState(
  {
    selectedReferenceId: "ref-1",
    references: [{ id: "ref-1", analysisId: "analysis-ref-1" }],
    analyses: [{ id: "analysis-ref-1", referenceId: "ref-1" }]
  },
  "ref-1"
);

assert.deepEqual(empty.references, []);
assert.deepEqual(empty.analyses, []);
assert.equal(empty.selectedReferenceId, null);
