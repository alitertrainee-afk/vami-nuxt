// local imports
import ChatListSection from "../sections/ChatListSection.vue";
import SearchResultsSection from "../sections/SearchResultsSection.vue";
import EmptyStateSection from "../sections/EmptyStateSection.vue";
import SectionHeader from "../sections/SectionHeader.vue";
import LoadingSection from "../sections/LoadingSection.vue";

/**
 * SECTION_REGISTRY — Single source of truth for sidebar section types.
 *
 * To add a new section type:
 *   1. Create a component in `sections/`
 *   2. Add an entry here with `component` and `resolveProps`
 *   3. Add a transform to `section-pipeline.config.js` that injects items with matching `type`
 *
 * resolveProps(item, ctx) receives:
 *   - item: the section item object from the pipeline
 *   - ctx: { activeChatId, onChatSelect, onChatContextAction, onUserClick, onNewChat }
 */
export const SECTION_REGISTRY = {
  loading: {
    component: LoadingSection,
    resolveProps: () => ({}),
  },

  section_header: {
    component: SectionHeader,
    resolveProps: (item) => ({
      label: item.label,
    }),
  },

  chat_list: {
    component: ChatListSection,
    resolveProps: (item, ctx) => ({
      chats: item.chats,
      activeChatId: item.activeChatId,
      onSelect: ctx.onChatSelect,
      onContextAction: ctx.onChatContextAction,
    }),
  },

  search_results: {
    component: SearchResultsSection,
    resolveProps: (item, ctx) => ({
      users: item.users,
      onSelect: ctx.onUserClick,
    }),
  },

  empty_state: {
    component: EmptyStateSection,
    resolveProps: (item, ctx) => ({
      showCta: item.showCta,
      onNewChat: ctx.onNewChat,
    }),
  },
};
