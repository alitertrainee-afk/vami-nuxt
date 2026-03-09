export function createWorkflowService(apiFetch) {
  return {
    getWorkflows() {
      return apiFetch("/workflows");
    },

    createWorkflow(data) {
      return apiFetch("/workflows", { method: "POST", body: data });
    },

    deleteWorkflow(workflowId) {
      return apiFetch(`/workflows/${workflowId}`, { method: "DELETE" });
    },

    addStep(workflowId, data) {
      return apiFetch(`/workflows/${workflowId}/step`, {
        method: "POST",
        body: data,
      });
    },

    updateStep(workflowId, stepId, data) {
      return apiFetch(`/workflows/${workflowId}/step/${stepId}`, {
        method: "PUT",
        body: data,
      });
    },

    deleteStep(workflowId, stepId) {
      return apiFetch(`/workflows/${workflowId}/step/${stepId}`, {
        method: "DELETE",
      });
    },

    reorderStep(workflowId, data) {
      return apiFetch(`/workflows/${workflowId}/reorder`, {
        method: "PUT",
        body: data,
      });
    },
  };
}
