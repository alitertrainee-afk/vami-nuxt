export function createChatService(apiFetch) {
  return {
    fetchConversations() {
      return apiFetch("/chats");
    },

    accessChat(userId) {
      return apiFetch("/chats", { method: "POST", body: { userId } });
    },

    fetchMessages(chatId, params = {}) {
      return apiFetch(`/messages/${chatId}`, { params });
    },
  };
}
