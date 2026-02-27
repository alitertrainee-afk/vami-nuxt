import { ref, computed, shallowRef } from "vue";

// Singleton panel stacks
const panelStacks = ref({
  left: [],
  right: [],
});

/**
 * usePanelManager — consolidated panel + UI state composable.
 *
 * Replaces both the old `usePanelManager` and `useChatUI`.
 * Manages panel stacks (left/right), sidebar/chat visibility,
 * info panel state, and active chat closing.
 */
export function usePanelManager() {
  // Lazy import to avoid circular dependency at module scope
  const _getChatStore = () => useChatStore();

  // --- Panel stack operations ---

  const openPanel = (side, component, props = {}) => {
    panelStacks.value[side].push({
      id: Date.now(),
      component: shallowRef(component),
      props,
    });
  };

  const closePanel = (side) => {
    if (panelStacks.value[side].length > 1) {
      panelStacks.value[side].pop();
    }
  };

  const closeAll = (side) => {
    panelStacks.value[side] = [];
  };

  // --- UI visibility (merged from useChatUI) ---

  const showSidebar = computed(() => !_getChatStore().activeChat);
  const showChatWindow = computed(() => !!_getChatStore().activeChat);
  const isInfoPanelOpen = computed(() => panelStacks.value.right.length > 0);

  const closeActiveChat = () => {
    _getChatStore().setActiveChat(null);
    closeAll("right");
  };

  const toggleInfoPanel = (infoPanelComponent) => {
    if (isInfoPanelOpen.value) {
      closeAll("right");
    } else if (infoPanelComponent) {
      openPanel("right", infoPanelComponent);
    }
  };

  return {
    panelStacks,
    openPanel,
    closePanel,
    closeAll,
    // UI visibility (was useChatUI)
    showSidebar,
    showChatWindow,
    isInfoPanelOpen,
    closeActiveChat,
    toggleInfoPanel,
  };
}
