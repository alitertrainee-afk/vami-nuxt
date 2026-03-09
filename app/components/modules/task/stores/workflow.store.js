// libs imports
import { defineStore } from "pinia";
import { ref, computed } from "vue";

// services imports
import { createWorkflowService } from "~/services/workflow.service.js";

export const useWorkflowStore = defineStore("workflow", () => {
  // state
  const workflows = ref([]);
  const activeWorkflow = ref(null);
  console.log("🚀 ~ activeWorkflow:", activeWorkflow);
  const isLoading = ref(false);
  const error = ref(null);

  // getters
  const sortedSteps = computed(() => {
    if (!activeWorkflow.value?.steps) return [];
    return [...activeWorkflow.value.steps].sort((a, b) => {
      return a.sequence - b.sequence;
    });
  });

  // helpers
  function _getService() {
    const { apiFetch } = useApiFetch();
    return createWorkflowService(apiFetch);
  }

  function _syncActiveWorkflow(updatedWorkflow) {
    activeWorkflow.value = updatedWorkflow;

    const idx = workflows.value.findIndex(
      (workflow) => workflow?._id === updatedWorkflow?._id,
    );
    if (idx !== -1) workflows.value[idx] = updatedWorkflow;
  }

  // actions
  async function fetchWorkflows() {
    isLoading.value = true;
    error.value = null;

    try {
      const res = await _getService().getWorkflows();
      workflows.value = res.data;

      // Auto-select first workflow if nothing is active
      if (!activeWorkflow.value && workflows.value.length) {
        activeWorkflow.value = workflows.value[0];
      }
    } catch (err) {
      error.value = err?.data?.message || err.message || "Failed to fetch";
    } finally {
      isLoading.value = false;
    }
  }

  async function createWorkflow(data) {
    console.log("🚀 ~ createWorkflow ~ data:", data);
    error.value = null;

    try {
      const res = await _getService().createWorkflow(data);
      console.log("🚀 ~ createWorkflow ~ res:", res);
      workflows.value.unshift(res.data);
      activeWorkflow.value = res.data;
      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Create failed";
      return false;
    }
  }

  function selectWorkflow(workflow) {
    activeWorkflow.value = workflow;
  }

  async function deleteWorkflow(workflowId) {
    error.value = null;

    try {
      await _getService().deleteWorkflow(workflowId);
      workflows.value = workflows.value.filter(
        (workflow) => workflow?._id !== workflowId,
      );

      if (activeWorkflow.value?._id === workflowId) {
        activeWorkflow.value = workflows?.value[0] || null;
      }

      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Delete failed";
      return false;
    }
  }

  async function addStep(data) {
    if (!activeWorkflow.value) return false;
    error.value = null;

    try {
      const res = await _getService().addStep(activeWorkflow.value?._id, data);
      _syncActiveWorkflow(res.data);
      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Add step failed";
      return false;
    }
  }

  async function updateStep(stepId, data) {
    if (!activeWorkflow.value) return false;
    error.value = null;

    try {
      const res = await _getService().updateStep(
        activeWorkflow.value?._id,
        stepId,
        data,
      );
      _syncActiveWorkflow(res.data);
      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Update failed";
      return false;
    }
  }

  async function deleteStep(stepId) {
    if (!activeWorkflow.value) return false;
    error.value = null;

    try {
      const res = await _getService().deleteStep(
        activeWorkflow.value._id,
        stepId,
      );
      _syncActiveWorkflow(res.data);
      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Delete step failed";
      return false;
    }
  }

  async function reorderStep(stepId, newSequence) {
    if (!activeWorkflow.value) return false;
    error.value = null;

    try {
      const res = await _getService().reorderStep(activeWorkflow.value?._id, {
        stepId,
        newSequence,
      });
      _syncActiveWorkflow(res.data);
      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Reorder failed";
      return false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    workflows,
    activeWorkflow,
    isLoading,
    error,
    // Getters
    sortedSteps,
    // Actions
    fetchWorkflows,
    createWorkflow,
    selectWorkflow,
    deleteWorkflow,
    addStep,
    updateStep,
    deleteStep,
    reorderStep,
    clearError,
  };
});
