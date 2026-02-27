import MessageRow from "../rows/MessageRow.vue";
import DateSeparatorRow from "../rows/DateSeparatorRow.vue";
import SystemAlertRow from "../rows/SystemAlertRow.vue";
import WelcomeCardRow from "../rows/WelcomeCardRow.vue";
import TypingIndicatorRow from "../rows/TypingIndicatorRow.vue";

/**
 * ROW_REGISTRY — Single source of truth for chat body row types.
 *
 * To add a new row type:
 *   1. Create a component in `rows/`
 *   2. Add an entry here with `component` and `resolveProps`
 *   3. Ensure your timeline transform injects items with matching `type`
 *
 * resolveProps(item, ctx) receives:
 *   - item: the timeline item object
 *   - ctx: { currentUserId, activeChat }
 */
export const ROW_REGISTRY = {
  message: {
    component: MessageRow,
    resolveProps: (item, ctx) => ({
      message: item,
      isMe:
        (typeof item.sender === "object" ? item.sender?._id : item.sender) ===
        ctx.currentUserId,
      isFirstInCluster: item.isFirstInCluster,
    }),
  },

  date_separator: {
    component: DateSeparatorRow,
    resolveProps: (item) => ({
      label: item.label,
    }),
  },

  system_alert: {
    component: SystemAlertRow,
    resolveProps: (item) => ({
      content: item.content,
    }),
  },

  welcome_card: {
    component: WelcomeCardRow,
    resolveProps: (item) => ({
      chatName: item.chatName,
      avatarUrl: item.avatarUrl,
    }),
  },

  typing: {
    component: TypingIndicatorRow,
    resolveProps: (item) => ({
      users: item.users,
    }),
  },
};
