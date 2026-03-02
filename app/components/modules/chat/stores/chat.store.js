import { defineStore } from "pinia";
import { ref, computed, shallowRef } from "vue";
import { createChatService } from "../services/chat.service.js";
import { createUserService } from "~/services/user.service.js";
import { useAuthStore } from "~/stores/auth.store.js";

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
    const idx = list.findIndex((c) => c._id.toString() === chatId.toString());
    if (idx !== -1) {
      const chat = { ...list[idx], latestMessage: message };
      list.splice(idx, 1);
      list.unshift(chat);
      conversations.value = list;
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
        (c) => c._id.toString() === chat._id.toString(),
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
  // E5: Optimistic Send
  // ---------------------------------------------------------------------------
  function sendMessage(content) {
    if (!activeChat.value || !content.trim()) return;

    const authStore = useAuthStore();

    // Optimistic: show message immediately with pending state
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      content: content.trim(),
      sender: authStore.user,
      conversation: activeChat.value._id,
      createdAt: new Date().toISOString(),
      status: "sending",
      _optimistic: true,
    };
    messages.value = [...messages.value, optimisticMsg];

    // Update sidebar immediately
    _updateSidebarLatestMessage(activeChat.value._id, optimisticMsg);

    // Emit to server
    const socket = useSocket();
    socket.emit("send_message", {
      roomId: activeChat.value._id,
      content: content.trim(),
    });
  }

  // ---------------------------------------------------------------------------
  // Socket & Real-Time
  // ---------------------------------------------------------------------------
  function initializeSocket(authToken) {
    const socket = useSocket();
    socket.connect(authToken);

    // Incoming messages — replace optimistic if exists
    socket.on("receive_message", (message) => {
      // Check if this is the echo of our own optimistic message
      const currentMsgs = [...messages.value];
      const optimisticIdx = currentMsgs.findIndex(
        (m) =>
          m._optimistic &&
          m.content === message.content &&
          m.conversation === message.conversation,
      );

      if (optimisticIdx !== -1) {
        // Replace optimistic with real
        currentMsgs[optimisticIdx] = message;
        messages.value = currentMsgs;
      } else if (
        activeChat.value &&
        activeChat.value._id === message.conversation
      ) {
        messages.value = [...messages.value, message];
      }

      _updateSidebarLatestMessage(message?.conversation, message);
    });

    // Background unread notifications
    socket.on("new_message_notification", ({ chatId, message, sender }) => {
      if (activeChat.value?._id === chatId) return;
      const list = [...conversations.value];
      const idx = list.findIndex((c) => c._id === chatId);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          unreadCount: (list[idx].unreadCount || 0) + 1,
        };
        conversations.value = list;
        _updateSidebarLatestMessage(chatId, { content: message, sender });
      }
    });

    // Presence — use immutable Set pattern for reactivity
    socket.on("user_status_update", ({ userId, isOnline }) => {
      const newSet = new Set(onlineUsers.value);
      isOnline ? newSet.add(userId) : newSet.delete(userId);
      onlineUsers.value = newSet;
    });

    // Typing indicators
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
  }

  function disconnectSocket() {
    const socket = useSocket();
    socket.off("receive_message");
    socket.off("new_message_notification");
    socket.off("user_status_update");
    socket.off("user_typing");
    socket.off("user_stopped_typing");
    socket.disconnect();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    conversations,
    activeChat,
    messages,
    pagination,
    currentPage,
    isLoadingChats,
    isLoadingMessages,
    onlineUsers,
    typingUsers,
    error,
    activeFilter,
    searchQuery,
    searchResults,
    isSearching,
    unreadMessagesTotal,
    unreadChatsCount,
    filteredConversations,
    setFilter,
    handleSearch,
    loadConversations,
    setActiveChat,
    loadMoreMessages,
    jumpToLatest,
    setActiveChatFromUser,
    sendMessage,
    initializeSocket,
    disconnectSocket,
  };
});
