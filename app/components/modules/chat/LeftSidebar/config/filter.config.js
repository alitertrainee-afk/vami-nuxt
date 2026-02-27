/**
 * Filter definitions for the sidebar filter chips.
 *
 * Each filter:
 *   - key: unique identifier, matches store's activeFilter values
 *   - label: display text
 *   - countKey: (optional) store getter name to show count badge
 */
export const SIDEBAR_FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread", countKey: "unreadChatsCount" },
  { key: "groups", label: "Groups" },
];
