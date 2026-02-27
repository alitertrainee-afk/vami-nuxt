/**
 * Section Pipeline — ordered transforms that compute which sidebar sections to render.
 *
 * Each transform: (sections, ctx) => sections
 *   - sections: array of section objects
 *   - ctx: { isLoadingChats, filteredConversations, searchQuery, searchResults, activeChatId }
 *
 * Transforms run in order. Output of one feeds the next.
 * Each transform MUST return a new array (no mutations).
 */

// --- Loading state ---
function injectLoadingSection(sections, ctx) {
  if (!ctx.isLoadingChats) return sections;

  return [
    ...sections,
    {
      _id: "loading",
      type: "loading",
    },
  ];
}

// --- Chat list section ---
function injectChatListSection(sections, ctx) {
  if (ctx.isLoadingChats) return sections;
  if (ctx.filteredConversations.length === 0) return sections;

  const result = [...sections];

  // Show "Recent Chats" header when searching
  if (ctx.searchQuery) {
    result.push({
      _id: "header-recent",
      type: "section_header",
      label: "Recent Chats",
    });
  }

  result.push({
    _id: "chat-list",
    type: "chat_list",
    chats: ctx.filteredConversations,
    activeChatId: ctx.activeChatId,
  });

  return result;
}

// --- Search results section ---
function injectSearchResultsSection(sections, ctx) {
  if (!ctx.searchQuery || ctx.searchResults.length === 0) return sections;

  return [
    ...sections,
    {
      _id: "header-search",
      type: "section_header",
      label: "Global Search Results",
    },
    {
      _id: "search-results",
      type: "search_results",
      users: ctx.searchResults,
    },
  ];
}

// --- Empty state ---
function injectEmptyState(sections, ctx) {
  if (ctx.isLoadingChats) return sections;

  const hasChats = ctx.filteredConversations.length > 0;
  const hasSearchResults = ctx.searchQuery && ctx.searchResults.length > 0;

  // Don't show empty if we have any content
  if (hasChats || hasSearchResults) return sections;

  return [
    ...sections,
    {
      _id: "empty-state",
      type: "empty_state",
      showCta: !ctx.searchQuery,
    },
  ];
}

/**
 * SECTION_TRANSFORMS — ordered pipeline.
 */
export const SECTION_TRANSFORMS = [
  injectLoadingSection,
  injectChatListSection,
  injectSearchResultsSection,
  injectEmptyState,
];
