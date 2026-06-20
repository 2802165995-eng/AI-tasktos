export function createAnalysisTask(id = `analysis-task-${Date.now()}`) {
  return {
    id,
    controller: new AbortController(),
    cancelled: false
  };
}

export function cancelAnalysisTask(task) {
  if (!task || task.cancelled) return;
  task.cancelled = true;
  task.controller.abort(new DOMException("用户取消分析", "AbortError"));
}

export function isCurrentAnalysisTask(currentTask, candidateTask) {
  return Boolean(
    currentTask &&
      candidateTask &&
      currentTask.id === candidateTask.id &&
      !candidateTask.cancelled
  );
}

export function recoverAnalysisState(state) {
  if (!state?.isAnalyzing) return state;
  return {
    ...state,
    isAnalyzing: false,
    analysisNotice: "上次分析已中断，请重新提交。"
  };
}
