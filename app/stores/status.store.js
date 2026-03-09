import { defineStore } from "pinia";
import { ref } from "vue";
import { createChatService } from "~/components/modules/chat/services/chat.service.js";

/**
 * Status / Stories store.
 * Covers Phase 5 — status feed, my statuses, create, view, delete.
 */
export const useStatusStore = defineStore("status", () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const statuses = ref([]);          // feed statuses (other users)
  const myStatuses = ref([]);        // current user's own statuses
  const isLoading = ref(false);
  const isCreating = ref(false);
  const error = ref(null);

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------
  function _getService() {
    const { apiFetch } = useApiFetch();
    return createChatService(apiFetch);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  async function loadFeed() {
    isLoading.value = true;
    try {
      const svc = _getService();
      const res = await svc.fetchStatusFeed();
      statuses.value = res.data || [];
    } catch (err) {
      console.error("[StatusStore] Load feed failed:", err);
      error.value = err?.data?.message || "Failed to load status feed";
    } finally {
      isLoading.value = false;
    }
  }

  async function loadMyStatuses() {
    try {
      const svc = _getService();
      const res = await svc.fetchMyStatuses();
      myStatuses.value = res.data || [];
    } catch (err) {
      console.error("[StatusStore] Load my statuses failed:", err);
    }
  }

  async function createStatus(payload) {
    isCreating.value = true;
    try {
      const svc = _getService();
      const res = await svc.createStatus(payload);
      const newStatus = res.data;
      myStatuses.value = [newStatus, ...myStatuses.value];
      return newStatus;
    } catch (err) {
      console.error("[StatusStore] Create status failed:", err);
      throw err;
    } finally {
      isCreating.value = false;
    }
  }

  async function viewStatus(statusId) {
    try {
      const svc = _getService();
      const res = await svc.viewStatus(statusId);
      // Update view count in feed
      const updated = res.data;
      const idx = statuses.value.findIndex((s) => s._id === statusId);
      if (idx !== -1) {
        const list = [...statuses.value];
        list[idx] = { ...list[idx], viewCount: updated.viewCount };
        statuses.value = list;
      }
      // Also update in myStatuses
      const myIdx = myStatuses.value.findIndex((s) => s._id === statusId);
      if (myIdx !== -1) {
        const list = [...myStatuses.value];
        list[myIdx] = { ...list[myIdx], viewCount: updated.viewCount };
        myStatuses.value = list;
      }
    } catch (err) {
      // Non-critical — don't surface to UI
      console.warn("[StatusStore] View status failed:", err);
    }
  }

  async function deleteStatus(statusId) {
    try {
      const svc = _getService();
      await svc.deleteStatus(statusId);
      myStatuses.value = myStatuses.value.filter((s) => s._id !== statusId);
    } catch (err) {
      console.error("[StatusStore] Delete status failed:", err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Socket handlers — call from chat layout once socket is ready
  // ---------------------------------------------------------------------------
  function handleContactStatusUpdated({ userId, statusId }) {
    // Re-fetch the feed when a contact posts a new status
    loadFeed();
  }

  function handleContactStatusDeleted({ statusId, userId }) {
    statuses.value = statuses.value.filter((s) => s._id !== statusId);
  }

  function handleStatusViewed({ statusId, viewerId, viewCount }) {
    const idx = myStatuses.value.findIndex((s) => s._id === statusId);
    if (idx !== -1) {
      const list = [...myStatuses.value];
      list[idx] = { ...list[idx], viewCount };
      myStatuses.value = list;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    statuses, myStatuses, isLoading, isCreating, error,
    loadFeed, loadMyStatuses, createStatus, viewStatus, deleteStatus,
    handleContactStatusUpdated, handleContactStatusDeleted, handleStatusViewed,
  };
});
