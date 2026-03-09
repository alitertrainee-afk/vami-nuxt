import { defineStore } from "pinia";
import { ref, computed, shallowRef } from "vue";
import { createChatService } from "../services/chat.service.js";
import { createUserService } from "~/services/user.service.js";
import { useAuthStore } from "~/stores/auth.store.js";

// ---------------------------------------------------------------------------
// NOTE: This store covers backend Phases 2-5:
//   Phase 2 — reactions, edit, delete, reply-to, receipts, starred
//   Phase 3 — media messages (handled via sendMessage enhancements)
//   Phase 4 — group management, block/unblock, conversation settings
//   Phase 5 — status/stories socket events (store-level only)
// ---------------------------------------------------------------------------

/**
 * Chat Store — Composition API style.
 * Uses `useSocket` composable for reactive socket state.
 */
export const useChatStore = defineStore("chat", () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const conversations = shallowRef([]);
  const activeChat = ref(null);
  const messages = shallowRef([]);
  const pagination = ref(null);
  const currentPage = ref(1);
  const isLoadingChats = ref(false);
  const isLoadingMessages = ref(false);
  const onlineUsers = ref(new Set());
  const typingUsers = ref(new Set());
  const error = ref(null);

  // Search & Filters
  const activeFilter = ref("all");
  const searchQuery = ref("");
  const searchResults = ref([]);
  const isSearching = ref(false);

  // Phase 2 — Reply-to composer state
  const replyingTo = ref(null);

  // Phase 2 — Starred messages
  const starredMessages = ref([]);
  const isLoadingStarred = ref(false);

  // Phase 4 — Group invite link (temporary)
  const groupInviteLink = ref(null);

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  const unreadMessagesTotal = computed(() =>
    conversations.value.reduce(
      (total, chat) => total + (chat?.unreadCount || 0),
      0,
    ),
  );

  const unreadChatsCount = computed(
    () => conversations.value.filter((chat) => chat?.unreadCount > 0).length,
  );

  const filteredConversations = computed(() => {
    const authStore = useAuthStore();
    const currentUserId = authStore.user?._id;

    return conversations.value.filter((chat) => {
      if (activeFilter.value === "unread" && !(chat?.unreadCount > 0))
        return false;
      if (activeFilter.value === "groups" && !chat?.isGroupChat) return false;
      if (activeFilter.value === "favourites" && !chat?.isPinned) return false;

      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        let chatName = "";
        if (chat?.isGroupChat) {
          chatName = chat.chatName || "";
        } else {
          const otherUser = chat?.participants?.find(
            (p) => p?._id !== currentUserId,
          );
          chatName = otherUser?.username || "Unknown User";
        }
        if (!chatName.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function _getServices() {
    const { apiFetch } = useApiFetch();
    return {
      chatService: createChatService(apiFetch),
      userService: createUserService(apiFetch),
    };
  }

  function _updateSidebarLatestMessage(chatId, message) {
    if (!chatId) return;
    const list = [...conversations.value];
    const idx = list.findIndex((c) => c._id?.toString() === chatId?.toString());
    if (idx !== -1) {
      const chat = { ...list[idx], latestMessage: message };
      list.splice(idx, 1);
      list.unshift(chat);
      conversations.value = list;
    }
  }

  // Immutable patch for a single message in the active list
  function _patchMessage(messageId, patchFn) {
    const list = [...messages.value];
    const idx = list.findIndex((m) => m._id?.toString() === messageId?.toString());
    if (idx !== -1) {
      list[idx] = patchFn({ ...list[idx] });
      messages.value = list;
    }
  }

  // ---------------------------------------------------------------------------
  // Search & Filter Actions
  // ---------------------------------------------------------------------------
  function setFilter(filterKey) {
    activeFilter.value = filterKey;
  }

  async function handleSearch(query) {
    searchQuery.value = query;
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }
    isSearching.value = true;
    try {
      const { userService } = _getServices();
      const response = await userService.searchUsers(query);
      searchResults.value = response.data || [];
    } catch (err) {
      console.error("[ChatStore] Search failed:", err);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // REST API Actions
  // ---------------------------------------------------------------------------
  async function loadConversations() {
    isLoadingChats.value = true;
    try {
      const { chatService } = _getServices();
      const response = await chatService.fetchConversations();
      conversations.value = response.data || [];
    } catch (err) {
      error.value = err?.data?.message || "Failed to load conversations";
      console.error("[ChatStore] Load conversations failed:", err);
    } finally {
      isLoadingChats.value = false;
    }
  }

  async function setActiveChat(chat) {
    const socket = useSocket();

    if (activeChat.value) {
      socket.emit("leave_room", activeChat.value._id);
    }

    activeChat.value = chat;
    messages.value = [];
    currentPage.value = 1;
    pagination.value = null;
    typingUsers.value = new Set();
    replyingTo.value = null;

    if (!chat) return;

    socket.emit("join_room", chat._id);
    socket.emit("mark_as_read", chat._id);

    // Reset local unread count
    const list = [...conversations.value];
    const idx = list.findIndex((c) => c._id === chat._id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], unreadCount: 0 };
      conversations.value = list;
    }

    isLoadingMessages.value = true;
    try {
      const { chatService } = _getServices();
      const response = await chatService.fetchMessages(chat._id, {
        page: 1,
        limit: 20,
      });
      const { messages: msgs, pagination: pag } = response.data;
      messages.value = msgs;
      pagination.value = pag;
    } catch (err) {
      error.value = err?.data?.message || "Failed to load messages";
      console.error("[ChatStore] Load messages failed:", err);
    } finally {
      isLoadingMessages.value = false;
    }
  }

  async function loadMoreMessages() {
    if (!pagination.value?.hasNext || isLoadingMessages.value) return;
    isLoadingMessages.value = true;
    try {
      const nextPage = currentPage.value + 1;
      const { chatService } = _getServices();
      const response = await chatService.fetchMessages(activeChat.value._id, {
        page: nextPage,
        limit: 20,
      });
      const { messages: olderMsgs, pagination: pag } = response.data;
      messages.value = [...olderMsgs, ...messages.value];
      currentPage.value = nextPage;
      pagination.value = pag;
    } catch (err) {
      console.error("[ChatStore] Load more messages failed:", err);
    } finally {
      isLoadingMessages.value = false;
    }
  }

  async function jumpToLatest() {
    if (!activeChat.value) return;
    isLoadingMessages.value = true;
    try {
      const { chatService } = _getServices();
      const response = await chatService.fetchMessages(activeChat.value._id, {
        page: 1,
        limit: 20,
      });
      const { messages: msgs, pagination: pag } = response.data;
      messages.value = msgs;
      currentPage.value = 1;
      pagination.value = pag;
    } catch (err) {
      console.error("[ChatStore] Jump to latest failed:", err);
    } finally {
      isLoadingMessages.value = false;
    }
  }

  async function setActiveChatFromUser(userId) {
    try {
      const { chatService } = _getServices();
      const response = await chatService.accessChat(userId);
      const chat = response.data;
      const exists = conversations.value.some(
        (c) => c._id?.toString() === chat._id?.toString(),
      );
      if (!exists) {
        conversations.value = [chat, ...conversations.value];
      }
      await setActiveChat(chat);
      return chat;
    } catch (err) {
      error.value = err?.data?.message || "Failed to access chat";
      console.error("[ChatStore] Access chat failed:", err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Send — optimistic + socket (Phase 2 / 3 enhancements)
  // ---------------------------------------------------------------------------
  /**
   * @param {Object|string} payload  Either a plain string (backwards-compat) or:
   *   { content, type, mediaKey, mediaUrl, mediaMimeType, mediaSize, mediaDuration }
   */
  function sendMessage(payload) {
    if (!activeChat.value) return;
    const isLegacy = typeof payload === "string";
    const content       = isLegacy ? payload : payload?.content;
    const mediaKey      = isLegacy ? undefined : payload?.mediaKey;
    const mediaUrl      = isLegacy ? undefined : payload?.mediaUrl;
    const mediaMimeType = isLegacy ? undefined : payload?.mediaMimeType;
    const mediaSize     = isLegacy ? undefined : payload?.mediaSize;
    const mediaDuration = isLegacy ? undefined : payload?.mediaDuration;
    const explicitType  = isLegacy ? undefined : payload?.type;

    if (!content?.trim() && !mediaKey) return;

    const msgType = explicitType ?? (
      mediaKey
        ? (mediaMimeType?.startsWith("image/") ? "image"
          : mediaMimeType?.startsWith("video/") ? "video"
          : mediaMimeType?.startsWith("audio/") ? "audio"
          : "document")
        : "text"
    );

    const authStore = useAuthStore();
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      content: content?.trim() || null,
      type: msgType,
      mediaKey, mediaUrl, mediaMimeType, mediaSize, mediaDuration,
      sender: authStore.user,
      replyTo: replyingTo.value,
      conversation: activeChat.value._id,
      createdAt: new Date().toISOString(),
      status: "sending",
      reactions: [],
      _optimistic: true,
    };
    messages.value = [...messages.value, optimisticMsg];
    _updateSidebarLatestMessage(activeChat.value._id, optimisticMsg);

    const socket = useSocket();
    socket.emit("send_message", {
      roomId: activeChat.value._id,
      content: content?.trim() || undefined,
      type: msgType !== "text" ? msgType : undefined,
      replyToId: replyingTo.value?._id || undefined,
      mediaKey, mediaUrl, mediaMimeType, mediaSize, mediaDuration,
    });

    replyingTo.value = null;
  }

  // ---------------------------------------------------------------------------
  // Phase 2 — Reply-to
  // ---------------------------------------------------------------------------
  function setReplyingTo(message) { replyingTo.value = message; }
  function clearReplyingTo() { replyingTo.value = null; }

  // ---------------------------------------------------------------------------
  // Phase 2 — Reactions (socket-based)
  // ---------------------------------------------------------------------------
  function reactToMessage(messageId, emoji) {
    const socket = useSocket();
    socket.emit("react_to_message", {
      messageId,
      emoji,
      roomId: activeChat.value?._id,
    });
  }

  // ---------------------------------------------------------------------------
  // Phase 2 — Edit / Delete (socket-based)
  // ---------------------------------------------------------------------------
  function editMessage(messageId, content) {
    const socket = useSocket();
    socket.emit("edit_message", {
      messageId,
      content,
      roomId: activeChat.value?._id,
    });
  }

  function deleteMessage(messageId, scope = "me") {
    const socket = useSocket();
    socket.emit("delete_message", {
      messageId,
      scope,
      roomId: activeChat.value?._id,
    });
  }

  // ---------------------------------------------------------------------------
  // Phase 2 — Starred messages
  // ---------------------------------------------------------------------------
  async function starMessage(messageId) {
    try {
      const { chatService } = _getServices();
      await chatService.starMessage(messageId);
      _patchMessage(messageId, (m) => ({ ...m, isStarred: true }));
    } catch (err) {
      console.error("[ChatStore] Star failed:", err);
    }
  }

  async function unstarMessage(messageId) {
    try {
      const { chatService } = _getServices();
      await chatService.unstarMessage(messageId);
      _patchMessage(messageId, (m) => ({ ...m, isStarred: false }));
    } catch (err) {
      console.error("[ChatStore] Unstar failed:", err);
    }
  }

  async function loadStarredMessages() {
    isLoadingStarred.value = true;
    try {
      const { chatService } = _getServices();
      const res = await chatService.getStarredMessages();
      starredMessages.value = res.data || [];
    } catch (err) {
      console.error("[ChatStore] Load starred failed:", err);
    } finally {
      isLoadingStarred.value = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 4 — Conversation participant settings (pin / archive / mute)
  // ---------------------------------------------------------------------------
  async function updateConversationSetting(chatId, settings) {
    try {
      const { chatService } = _getServices();
      await chatService.updateConversationSettings(chatId, settings);
      const list = [...conversations.value];
      const idx = list.findIndex((c) => c._id?.toString() === chatId?.toString());
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...settings };
        conversations.value = list;
      }
    } catch (err) {
      console.error("[ChatStore] Update conversation setting failed:", err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 4 — Group management
  // ---------------------------------------------------------------------------
  async function leaveGroup(chatId) {
    const { chatService } = _getServices();
    await chatService.leaveGroup(chatId);
    conversations.value = conversations.value.filter(
      (c) => c._id?.toString() !== chatId?.toString(),
    );
    if (activeChat.value?._id?.toString() === chatId?.toString()) {
      activeChat.value = null;
      messages.value = [];
    }
  }

  async function updateGroupInfo(chatId, body) {
    const { chatService } = _getServices();
    const res = await chatService.updateGroupInfo(chatId, body);
    const updated = res.data;
    const list = [...conversations.value];
    const idx = list.findIndex((c) => c._id?.toString() === chatId?.toString());
    if (idx !== -1) { list[idx] = { ...list[idx], ...updated }; conversations.value = list; }
    if (activeChat.value?._id?.toString() === chatId?.toString()) {
      activeChat.value = { ...activeChat.value, ...updated };
    }
    return updated;
  }

  async function promoteAdmin(chatId, userId) {
    const { chatService } = _getServices();
    const res = await chatService.promoteAdmin(chatId, userId);
    if (activeChat.value?._id?.toString() === chatId?.toString()) {
      activeChat.value = { ...activeChat.value, ...res.data };
    }
    return res.data;
  }

  async function demoteAdmin(chatId, userId) {
    const { chatService } = _getServices();
    const res = await chatService.demoteAdmin(chatId, userId);
    if (activeChat.value?._id?.toString() === chatId?.toString()) {
      activeChat.value = { ...activeChat.value, ...res.data };
    }
    return res.data;
  }

  async function addMember(chatId, userId) {
    const { chatService } = _getServices();
    const res = await chatService.addMember(chatId, userId);
    if (activeChat.value?._id?.toString() === chatId?.toString()) {
      activeChat.value = { ...activeChat.value, ...res.data };
    }
    return res.data;
  }

  async function removeMember(chatId, userId) {
    const { chatService } = _getServices();
    const res = await chatService.removeMember(chatId, userId);
    if (activeChat.value?._id?.toString() === chatId?.toString()) {
      activeChat.value = { ...activeChat.value, ...res.data };
    }
    return res.data;
  }

  async function generateInviteLink(chatId) {
    const { chatService } = _getServices();
    const res = await chatService.generateInviteLink(chatId);
    groupInviteLink.value = res.data?.inviteLink ?? null;
    return res.data;
  }

  async function revokeInviteLink(chatId) {
    const { chatService } = _getServices();
    await chatService.revokeInviteLink(chatId);
    groupInviteLink.value = null;
  }

  // ---------------------------------------------------------------------------
  // Socket & Real-Time
  // ---------------------------------------------------------------------------
  function initializeSocket(authToken) {
    const socket = useSocket();
    socket.connect(authToken);

    // ── Incoming messages — replace optimistic if exists ────────────────────
    socket.on("receive_message", (message) => {
      const currentMsgs = [...messages.value];
      const optimisticIdx = currentMsgs.findIndex(
        (m) =>
          m._optimistic &&
          m.content === message.content &&
          m.conversation?.toString() === message.conversation?.toString(),
      );
      if (optimisticIdx !== -1) {
        currentMsgs[optimisticIdx] = { ...message, _optimistic: false };
        messages.value = currentMsgs;
      } else if (
        activeChat.value &&
        activeChat.value._id?.toString() === message.conversation?.toString()
      ) {
        messages.value = [...messages.value, message];
      }
      _updateSidebarLatestMessage(message?.conversation, message);
    });

    // ── Background unread ──────────────────────────────────────────────────
    socket.on("new_message_notification", ({ chatId, message, sender }) => {
      if (activeChat.value?._id === chatId) return;
      const list = [...conversations.value];
      const idx = list.findIndex((c) => c._id === chatId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], unreadCount: (list[idx].unreadCount || 0) + 1 };
        conversations.value = list;
        _updateSidebarLatestMessage(chatId, { content: message, sender });
      }
    });

    // ── Phase 2: Message status (tick states) ──────────────────────────────
    socket.on("message_status_update", ({ messageId, status }) => {
      _patchMessage(messageId, (m) => ({ ...m, status }));
    });

    // ── Phase 2: Reactions ─────────────────────────────────────────────────
    socket.on("message_reaction_updated", ({ messageId, reactions }) => {
      _patchMessage(messageId, (m) => ({ ...m, reactions }));
    });

    // ── Phase 2: Edit ──────────────────────────────────────────────────────
    socket.on("message_edited", ({ messageId, content, isEdited, editedAt }) => {
      _patchMessage(messageId, (m) => ({ ...m, content, isEdited, editedAt }));
    });

    // ── Phase 2: Delete ────────────────────────────────────────────────────
    socket.on("message_deleted", ({ messageId, scope, content }) => {
      if (scope === "everyone") {
        _patchMessage(messageId, (m) => ({
          ...m,
          isDeleted: true,
          content: content ?? "This message was deleted",
          reactions: [],
        }));
      } else {
        // Deleted for me — remove locally
        messages.value = messages.value.filter(
          (m) => m._id?.toString() !== messageId?.toString(),
        );
      }
    });

    // ── Presence ───────────────────────────────────────────────────────────
    socket.on("user_status_update", ({ userId, isOnline }) => {
      const newSet = new Set(onlineUsers.value);
      isOnline ? newSet.add(userId) : newSet.delete(userId);
      onlineUsers.value = newSet;
    });

    // ── Typing ─────────────────────────────────────────────────────────────
    socket.on("user_typing", ({ userId, roomId }) => {
      if (activeChat.value?._id === roomId) {
        const newSet = new Set(typingUsers.value);
        newSet.add(userId);
        typingUsers.value = newSet;
      }
    });

    socket.on("user_stopped_typing", ({ userId }) => {
      const newSet = new Set(typingUsers.value);
      newSet.delete(userId);
      typingUsers.value = newSet;
    });

    // ── Phase 4: Group events ──────────────────────────────────────────────
    socket.on("group_updated", ({ chatId, updates }) => {
      const list = [...conversations.value];
      const idx = list.findIndex((c) => c._id?.toString() === chatId?.toString());
      if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; conversations.value = list; }
      if (activeChat.value?._id?.toString() === chatId?.toString()) {
        activeChat.value = { ...activeChat.value, ...updates };
      }
    });

    socket.on("group_settings_changed", ({ chatId, settings }) => {
      if (activeChat.value?._id?.toString() === chatId?.toString()) {
        activeChat.value = { ...activeChat.value, ...settings };
      }
    });

    socket.on("group_member_added", () => {
      // Simplest approach: refresh conversation list to get updated participant counts
      loadConversations();
    });

    socket.on("group_member_left", ({ chatId, userId }) => {
      const authStore = useAuthStore();
      if (userId?.toString() === authStore.user?._id?.toString()) {
        // Current user was removed from group
        conversations.value = conversations.value.filter(
          (c) => c._id?.toString() !== chatId?.toString(),
        );
        if (activeChat.value?._id?.toString() === chatId?.toString()) {
          activeChat.value = null;
          messages.value = [];
        }
      } else if (activeChat.value?._id?.toString() === chatId?.toString()) {
        activeChat.value = {
          ...activeChat.value,
          participants: activeChat.value.participants?.filter(
            (p) => p._id?.toString() !== userId?.toString(),
          ),
        };
      }
    });

    socket.on("group_admin_promoted", ({ chatId, userId }) => {
      if (activeChat.value?._id?.toString() === chatId?.toString()) {
        const admins = [...(activeChat.value.admins || [])];
        if (!admins.some((a) => a?.toString() === userId?.toString())) admins.push(userId);
        activeChat.value = { ...activeChat.value, admins };
      }
    });

    socket.on("group_admin_demoted", ({ chatId, userId }) => {
      if (activeChat.value?._id?.toString() === chatId?.toString()) {
        activeChat.value = {
          ...activeChat.value,
          admins: activeChat.value.admins?.filter((a) => a?.toString() !== userId?.toString()),
        };
      }
    });
  }

  function disconnectSocket() {
    const socket = useSocket();
    const events = [
      "receive_message", "new_message_notification",
      "message_status_update", "message_reaction_updated",
      "message_edited", "message_deleted",
      "user_status_update", "user_typing", "user_stopped_typing",
      "group_updated", "group_settings_changed",
      "group_member_added", "group_member_left",
      "group_admin_promoted", "group_admin_demoted",
    ];
    events.forEach((e) => socket.off(e));
    socket.disconnect();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    // ── State ──
    conversations, activeChat, messages, pagination, currentPage,
    isLoadingChats, isLoadingMessages, onlineUsers, typingUsers, error,
    activeFilter, searchQuery, searchResults, isSearching,
    // Phase 2
    replyingTo, starredMessages, isLoadingStarred,
    // Phase 4
    groupInviteLink,
    // ── Getters ──
    unreadMessagesTotal, unreadChatsCount, filteredConversations,
    // ── Conversations ──
    setFilter, handleSearch,
    loadConversations, setActiveChat, loadMoreMessages, jumpToLatest, setActiveChatFromUser,
    // ── Send ──
    sendMessage,
    // ── Phase 2: Reply-to ──
    setReplyingTo, clearReplyingTo,
    // ── Phase 2: Reactions / Edit / Delete ──
    reactToMessage, editMessage, deleteMessage,
    // ── Phase 2: Starred ──
    starMessage, unstarMessage, loadStarredMessages,
    // ── Phase 4: Conversation settings ──
    updateConversationSetting,
    // ── Phase 4: Group management ──
    leaveGroup, updateGroupInfo,
    promoteAdmin, demoteAdmin,
    addMember, removeMember,
    generateInviteLink, revokeInviteLink,
    // ── Socket ──
    initializeSocket, disconnectSocket,
  };
});
