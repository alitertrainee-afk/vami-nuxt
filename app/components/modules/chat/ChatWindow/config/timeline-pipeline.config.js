/**
 * Timeline Pipeline — ordered array of pure transforms.
 *
 * Each transform: (items, ctx) => items
 *   - items: array of timeline item objects
 *   - ctx: { currentUserId, activeChat, typingUsers }
 *
 * Transforms run in order. The output of one feeds the next.
 * Each transform MUST return a new array (no mutations).
 */

// --- Date separator injection ---
function injectDateSeparators(items) {
  const result = [];
  let lastDate = null;

  for (const item of items) {
    if (item.type && item.type !== "message") {
      result.push(item);
      continue;
    }

    const msgDate = new Date(item.createdAt).toDateString();

    if (msgDate !== lastDate) {
      result.push({
        _id: `date-${msgDate}`,
        type: "date_separator",
        label: formatDateLabel(item.createdAt),
      });
      lastDate = msgDate;
    }

    result.push(item);
  }

  return result;
}

// --- Sender cluster detection ---
const CLUSTER_GAP_MS = 10 * 60 * 1000; // 10 minutes

function injectSenderClusters(items) {
  let lastSenderId = null;
  let lastTimestamp = null;

  return items.map((item) => {
    if (item.type !== "message") {
      lastSenderId = null;
      lastTimestamp = null;
      return item;
    }

    if (item.isSystemMessage) {
      lastSenderId = null;
      lastTimestamp = null;
      return { ...item, type: "system_alert" };
    }

    const senderId =
      typeof item.sender === "object" ? item.sender?._id : item.sender;
    const currentTimestamp = new Date(item.createdAt).getTime();
    const timeDiff = lastTimestamp
      ? currentTimestamp - lastTimestamp
      : Infinity;
    const isFirstInCluster =
      senderId !== lastSenderId || timeDiff > CLUSTER_GAP_MS;
    lastSenderId = senderId;
    lastTimestamp = currentTimestamp;

    return { ...item, type: "message", isFirstInCluster };
  });
}

// --- Welcome card for new/empty chats ---
function injectWelcomeCard(items, ctx) {
  if (!ctx.activeChat) return items;

  const hasRealMessages = items.some(
    (i) => i.type === "message" || i.type === "system_alert",
  );

  // Only show welcome if there are no messages at all
  if (hasRealMessages) return items;

  const chat = ctx.activeChat;
  let chatName = "New Conversation";
  let avatarUrl = null;

  if (!chat.isGroupChat) {
    const otherUser = chat.participants?.find(
      (p) => p?._id !== ctx.currentUserId,
    );
    chatName = otherUser?.username || "Unknown User";
    avatarUrl = otherUser?.profile?.avatar || null;
  } else {
    chatName = chat.chatName || "New Group";
    avatarUrl = chat.groupAvatar || null;
  }

  return [
    {
      _id: "welcome-card",
      type: "welcome_card",
      chatName,
      avatarUrl,
    },
    ...items,
  ];
}

// --- Typing indicator at the bottom ---
function injectTypingIndicator(items, ctx) {
  if (!ctx.typingUsers || ctx.typingUsers.size === 0) return items;

  return [
    ...items,
    {
      _id: "typing-indicator",
      type: "typing",
      users: [...ctx.typingUsers],
    },
  ];
}

// --- Helper ---
function formatDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * TIMELINE_TRANSFORMS — ordered pipeline.
 * Order matters: clusters must run BEFORE date separators interfere with
 * sender tracking, but AFTER raw messages are typed as "message".
 */
export const TIMELINE_TRANSFORMS = [
  injectSenderClusters, // 1. detect clusters + convert system msgs
  injectDateSeparators, // 2. inject date rows between date boundaries
  injectWelcomeCard, // 3. prepend welcome card if empty chat
  injectTypingIndicator, // 4. append typing row at the bottom
];
