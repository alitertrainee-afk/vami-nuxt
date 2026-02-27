// libs imports
import { computed } from "vue";

// local imports
import { SECTION_TRANSFORMS } from "../config/section-pipeline.config.js";

/**
 * useSidebarBody — computes which sections to render via the pipeline.
 *
 * @param {Object} opts
 * @param {import('vue').Ref<boolean>} opts.isLoadingChats
 * @param {import('vue').Ref<Array>}   opts.filteredConversations
 * @param {import('vue').Ref<string>}  opts.searchQuery
 * @param {import('vue').Ref<Array>}   opts.searchResults
 * @param {import('vue').Ref<string>}  opts.activeChatId
 */
export function useSidebarBody({
  isLoadingChats,
  filteredConversations,
  searchQuery,
  searchResults,
  activeChatId,
}) {
  const sections = computed(() => {
    const ctx = {
      isLoadingChats: isLoadingChats.value,
      filteredConversations: filteredConversations.value,
      searchQuery: searchQuery.value,
      searchResults: searchResults.value,
      activeChatId: activeChatId.value,
    };

    return SECTION_TRANSFORMS.reduce(
      (items, transform) => transform(items, ctx),
      [],
    );
  });

  return { sections };
}
