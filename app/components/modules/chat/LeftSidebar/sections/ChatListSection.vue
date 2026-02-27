<script setup>
import ChatListItem from "../ChatListItem.vue";

defineProps({
  chats: { type: Array, required: true },
  activeChatId: { type: String, default: null },
  onSelect: { type: Function, required: true },
  onContextAction: { type: Function, required: true },
});
</script>

<template>
  <ul class="divide-y divide-gray-50">
    <li v-for="chat in chats" :key="chat?._id">
      <ChatListItem
        :chat="chat"
        :isActive="activeChatId === chat._id"
        @click="onSelect(chat)"
        @contextAction="onContextAction"
      />
    </li>
  </ul>
</template>
