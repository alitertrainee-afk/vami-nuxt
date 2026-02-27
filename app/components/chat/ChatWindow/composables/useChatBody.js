import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { TIMELINE_TRANSFORMS } from "../config/timeline-pipeline.config.js";

/**
 * useChatBody — owns scroll behaviour + timeline computation for ChatBody.
 *
 * @param {Object} opts
 * @param {import('vue').Ref<Array>}   opts.messages     - raw messages from store
 * @param {import('vue').Ref<boolean>} opts.hasNext      - whether older pages exist
 * @param {Function}                   opts.loadMore     - fetches next page
 * @param {import('vue').Ref<string>}  opts.currentUserId
 * @param {import('vue').Ref<Object>}  opts.activeChat
 * @param {import('vue').Ref<Set>}     opts.typingUsers
 */
export function useChatBody({
  messages,
  hasNext,
  loadMore,
  currentUserId,
  activeChat,
  typingUsers,
}) {
  const containerRef = ref(null);
  const isFetchingMore = ref(false);

  // --- Timeline pipeline ---
  const timelineItems = computed(() => {
    const raw = (messages.value || []).map((msg) => ({
      ...msg,
      type: "message",
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
  const scrollToBottom = async () => {
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const container = containerRef.value;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  };

  const handleScroll = async () => {
    const container = containerRef.value;
    if (!container) return;

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
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        200;
      if (isNearBottom) {
        await scrollToBottom();
      }
    },
  );

  return {
    containerRef,
    timelineItems,
    scrollToBottom,
    isFetchingMore,
  };
}
