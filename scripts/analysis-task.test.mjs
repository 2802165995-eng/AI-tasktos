import assert from "node:assert/strict";
import {
  cancelAnalysisTask,
  createAnalysisTask,
  isCurrentAnalysisTask,
  recoverAnalysisState
} from "../src/analysisTask.js";

const task = createAnalysisTask("task-1");
assert.equal(task.id, "task-1");
assert.equal(task.cancelled, false);
assert.equal(isCurrentAnalysisTask(task, task), true);

cancelAnalysisTask(task);
assert.equal(task.cancelled, true);
assert.equal(task.controller.signal.aborted, true);
assert.equal(isCurrentAnalysisTask(task, task), false);
assert.equal(isCurrentAnalysisTask({ id: "task-2" }, task), false);

assert.deepEqual(recoverAnalysisState({ isAnalyzing: false, analysisNotice: "" }), {
  isAnalyzing: false,
  analysisNotice: ""
});

assert.deepEqual(recoverAnalysisState({ isAnalyzing: true, analysisNotice: "正在分析" }), {
  isAnalyzing: false,
  analysisNotice: "上次分析已中断，请重新提交。"
});
