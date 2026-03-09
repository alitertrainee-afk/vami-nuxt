import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { TIMELINE_TRANSFORMS } from "../config/timeline-pipeline.config.js";

export function useChatBody({
  messages,
  hasNext,
  hasPrev,
  loadMore,
  jumpToLatest,
  currentUserId,
  activeChat,
  typingUsers,
}) {
  const containerRef = ref(null);
  const isFetchingMore = ref(false);
  const showScrollToBottom = ref(false);

  // --- Timeline pipeline ---
  const timelineItems = computed(() => {
    const raw = (messages.value || []).map((msg) => ({
      ...msg,
      _row: "message",   // row-registry key — does NOT overwrite message.type ("image", "video", etc.)
    }));

    const ctx = {
      currentUserId: currentUserId.value,
      activeChat: activeChat.value,
      typingUsers: typingUsers.value,
    };

    return TIMELINE_TRANSFORMS.reduce(
      (items, transform) => transform(items, ctx),
      raw,
    );
  });

  // --- Scroll helpers ---
  const _isNearBottom = () => {
    const container = containerRef.value;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      200
    );
  };

  const scrollToBottom = async () => {
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const container = containerRef.value;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  };

  const handleJumpToBottom = async () => {
    if (hasPrev?.value) {
      // User has paginated past page 1 — re-fetch latest messages
      await jumpToLatest();
      await scrollToBottom();
    } else {
      // Already on page 1 — just scroll
      await scrollToBottom();
    }
  };

  const handleScroll = async () => {
    const container = containerRef.value;
    if (!container) return;

    // Update floating button visibility
    showScrollToBottom.value = !_isNearBottom();

    if (container.scrollTop <= 100) {
      if (isFetchingMore.value || !hasNext.value) return;

      isFetchingMore.value = true;
      const previousHeight = container.scrollHeight;

      await loadMore();

      await nextTick();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const newHeight = container.scrollHeight;
      container.scrollTop = newHeight - previousHeight;

      isFetchingMore.value = false;
    }
  };

  // --- Lifecycle ---
  onMounted(async () => {
    await nextTick();
    containerRef.value?.addEventListener("scroll", handleScroll, {
      passive: true,
    });
  });

  onUnmounted(() => {
    containerRef.value?.removeEventListener("scroll", handleScroll);
  });

  // --- Auto-scroll on new messages ---
  watch(
    () => messages.value?.length,
    async (newVal, oldVal) => {
      const container = containerRef.value;
      if (!container) return;

      // Initial load: snap to bottom
      if (oldVal === 0 && newVal > 0) {
        await scrollToBottom();
        return;
      }

      // Near-bottom: auto-scroll for new message
      if (_isNearBottom()) {
        await scrollToBottom();
      }
    },
  );

  return {
    containerRef,
    timelineItems,
    scrollToBottom,
    handleJumpToBottom,
    showScrollToBottom,
    isFetchingMore,
  };
}
