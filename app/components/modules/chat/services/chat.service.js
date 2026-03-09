export function createChatService(apiFetch) {
  return {
    // ----------------------------------------------------------------
    // Conversations
    // ----------------------------------------------------------------
    fetchConversations() {
      return apiFetch("/chats");
    },
    accessChat(userId) {
      return apiFetch("/chats", { method: "POST", body: { userId } });
    },
    updateConversationSettings(chatId, settings) {
      return apiFetch(`/chats/${chatId}/settings`, { method: "PATCH", body: settings });
    },

    // ----------------------------------------------------------------
    // Group management (Phase 4)
    // ----------------------------------------------------------------
    createGroup(body) {
      return apiFetch("/chats/group", { method: "POST", body });
    },
    renameGroup(chatId, chatName) {
      return apiFetch(`/chats/group/${chatId}/rename`, { method: "PUT", body: { chatName } });
    },
    updateGroupInfo(chatId, body) {
      return apiFetch(`/chats/group/${chatId}`, { method: "PATCH", body });
    },
    updateGroupSettings(chatId, body) {
      return apiFetch(`/chats/group/${chatId}/settings`, { method: "PATCH", body });
    },
    addMember(chatId, userId) {
      return apiFetch(`/chats/group/${chatId}/add`, { method: "PUT", body: { userId } });
    },
    removeMember(chatId, userId) {
      return apiFetch(`/chats/group/${chatId}/remove`, { method: "PUT", body: { userId } });
    },
    leaveGroup(chatId) {
      return apiFetch(`/chats/group/${chatId}/leave`, { method: "DELETE" });
    },
    promoteAdmin(chatId, userId) {
      return apiFetch(`/chats/group/${chatId}/promote`, { method: "PUT", body: { userId } });
    },
    demoteAdmin(chatId, userId) {
      return apiFetch(`/chats/group/${chatId}/demote`, { method: "PUT", body: { userId } });
    },
    generateInviteLink(chatId) {
      return apiFetch(`/chats/group/${chatId}/invite`);
    },
    revokeInviteLink(chatId) {
      return apiFetch(`/chats/group/${chatId}/invite`, { method: "DELETE" });
    },
    joinByInviteLink(token) {
      return apiFetch(`/chats/group/join/${token}`, { method: "POST" });
    },

    // ----------------------------------------------------------------
    // Messages
    // ----------------------------------------------------------------
    fetchMessages(chatId, params = {}) {
      return apiFetch(`/messages/${chatId}`, { params });
    },
    sendMessage(body) {
      return apiFetch("/messages", { method: "POST", body });
    },
    editMessage(messageId, content) {
      return apiFetch(`/messages/${messageId}/edit`, { method: "PATCH", body: { content } });
    },
    deleteMessage(messageId, scope = "me") {
      return apiFetch(`/messages/${messageId}`, { method: "DELETE", body: { scope } });
    },
    reactToMessage(messageId, emoji) {
      return apiFetch(`/messages/${messageId}/react`, { method: "POST", body: { emoji } });
    },
    starMessage(messageId) {
      return apiFetch(`/messages/${messageId}/star`, { method: "POST" });
    },
    unstarMessage(messageId) {
      return apiFetch(`/messages/${messageId}/star`, { method: "DELETE" });
    },
    getStarredMessages() {
      return apiFetch("/messages/starred");
    },
    setDisappearTimer(chatId, duration) {
      return apiFetch(`/messages/${chatId}/disappear`, { method: "PATCH", body: { duration } });
    },

    // ----------------------------------------------------------------
    // Media upload (Phase 3)
    // ----------------------------------------------------------------
    requestPresignedUrl(body) {
      return apiFetch("/uploads/presign", { method: "POST", body });
    },
    confirmUpload(key) {
      return apiFetch("/uploads/confirm", { method: "POST", body: { key } });
    },

    // ----------------------------------------------------------------
    // Status / Stories (Phase 5)
    // ----------------------------------------------------------------
    fetchStatusFeed() {
      return apiFetch("/statuses/feed");
    },
    fetchMyStatuses() {
      return apiFetch("/statuses/me");
    },
    createStatus(body) {
      return apiFetch("/statuses", { method: "POST", body });
    },
    viewStatus(statusId) {
      return apiFetch(`/statuses/${statusId}/view`, { method: "POST" });
    },
    getStatusViewers(statusId) {
      return apiFetch(`/statuses/${statusId}/viewers`);
    },
    deleteStatus(statusId) {
      return apiFetch(`/statuses/${statusId}`, { method: "DELETE" });
    },

    // ----------------------------------------------------------------
    // Push notifications (Phase 5)
    // ----------------------------------------------------------------
    getVapidPublicKey() {
      return apiFetch("/push/vapid-key");
    },
    subscribePush(subscription, deviceLabel = "") {
      return apiFetch("/push/subscribe", { method: "POST", body: { subscription, deviceLabel } });
    },
    unsubscribePush(endpoint) {
      return apiFetch("/push/subscribe", { method: "DELETE", body: { endpoint } });
    },
  };
}
