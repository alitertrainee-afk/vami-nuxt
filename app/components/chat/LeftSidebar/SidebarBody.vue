<script setup>
// libs imports
import { computed, toRef } from "vue";

// local imports
import { useSidebarBody } from "./composables/useSidebarBody.js";
import SidebarSection from "./SidebarSection.vue";

const props = defineProps({
  isLoadingChats: { type: Boolean, default: false },
  filteredConversations: { type: Array, required: true },
  searchQuery: { type: String, default: "" },
  searchResults: { type: Array, default: () => [] },
  activeChatId: { type: String, default: null },
  onChatSelect: { type: Function, required: true },
  onChatContextAction: { type: Function, required: true },
  onUserClick: { type: Function, required: true },
  onNewChat: { type: Function, required: true },
});

const { sections } = useSidebarBody({
  isLoadingChats: toRef(props, "isLoadingChats"),
  filteredConversations: toRef(props, "filteredConversations"),
  searchQuery: toRef(props, "searchQuery"),
  searchResults: toRef(props, "searchResults"),
  activeChatId: toRef(props, "activeChatId"),
});

const ctx = computed(() => ({
  onChatSelect: props.onChatSelect,
  onChatContextAction: props.onChatContextAction,
  onUserClick: props.onUserClick,
  onNewChat: props.onNewChat,
}));
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <SidebarSection
      v-for="section in sections"
      :key="section._id"
      :item="section"
      :ctx="ctx"
    />
  </div>
</template>
