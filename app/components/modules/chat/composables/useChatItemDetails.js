import { computed } from "vue";
import {
  TickDouble02Icon,
  Tick01Icon,
  NotificationOff02Icon,
  PinLocation02Icon,
} from "hugeicons-vue";

/**
 * useChatItemDetails — extracts computed display data for a chat list item.
 *
 * @param {Function} chatGetter - Getter for the chat object (use () => props.chat)
 */
export function useChatItemDetails(chatGetter) {
  const authStore = useAuthStore();
  const chatStore = useChatStore();

  const details = computed(() => {
    const chat = chatGetter();
    if (chat?.isGroupChat) {
      return { name: chat.chatName, avatar: null, isOnline: false };
    }
    const otherUser = chat?.participants?.find(
      (p) => p?._id !== authStore.user?._id,
    );
    return {
      name: otherUser?.username || "Unknown User",
      avatar: otherUser?.profile?.avatar,
      isOnline: chatStore.onlineUsers.has(otherUser?._id),
    };
  });

  const formattedTime = computed(() => {
    const chat = chatGetter();
    if (!chat?.latestMessage) return "";
    return new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const leftIndicators = computed(() => {
    const chat = chatGetter();
    const indicators = [];
    const latestMsg = chat?.latestMessage;
    const isMine = latestMsg?.sender === authStore.user?._id;

    if (isMine) {
      const isRead = latestMsg?.status === "read";
      indicators.push({
        id: "receipt",
        isIcon: true,
        component: isRead ? TickDouble02Icon : Tick01Icon,
        class: isRead ? "text-blue-500" : "text-gray-400",
      });
    }
    if (chat?.isMentioned) {
      indicators.push({
        id: "mention",
        isIcon: false,
        text: "@",
        class:
          "bg-gray-200 text-gray-600 rounded-full px-1.5 text-[10px] font-bold flex items-center",
      });
    }
    return indicators;
  });

  const rightBadges = computed(() => {
    const chat = chatGetter();
    const badges = [];

    if (chat?.isMuted) {
      badges.push({
        id: "muted",
        isIcon: true,
        component: NotificationOff02Icon,
        class: "text-gray-400",
      });
    }
    if (chat?.isPinned) {
      badges.push({
        id: "pinned",
        isIcon: true,
        component: PinLocation02Icon,
        class: "text-gray-400 transform rotate-45",
      });
    }
    if (chat?.unreadCount > 0) {
      badges.push({
        id: "unread",
        isIcon: false,
        text: chat.unreadCount,
        class:
          "bg-green-500 text-white text-[11px] font-bold px-1.5 py-0 min-w-[20px] h-[20px] rounded-full flex items-center justify-center",
      });
    }
    return badges;
  });

  return { details, formattedTime, leftIndicators, rightBadges };
}
