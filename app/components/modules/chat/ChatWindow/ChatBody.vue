<script setup>
// libs import
import { computed, toRef } from "vue";

// local imports
import { useChatBody } from "./composables/useChatBody.js";
import ChatRow from "./ChatRow.vue";

const props = defineProps({
  messages: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  hasNext: { type: Boolean, default: false },
  currentUserId: { type: String, required: true },
  activeChat: { type: Object, default: null },
  typingUsers: { type: Set, default: () => new Set() },
  loadMore: { type: Function, required: true },
});

const messagesRef = toRef(props, "messages");
const hasNextRef = toRef(props, "hasNext");
const currentUserIdRef = toRef(props, "currentUserId");
const activeChatRef = toRef(props, "activeChat");
const typingUsersRef = toRef(props, "typingUsers");

const { containerRef, timelineItems, scrollToBottom } = useChatBody({
  messages: messagesRef,
  hasNext: hasNextRef,
  loadMore: props.loadMore,
  currentUserId: currentUserIdRef,
  activeChat: activeChatRef,
  typingUsers: typingUsersRef,
});

const ctx = computed(() => ({
  currentUserId: props.currentUserId,
  activeChat: props.activeChat,
}));

defineExpose({ scrollToBottom });
</script>

<template>
  <div
    ref="containerRef"
    class="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col relative custom-scrollbar z-10"
  >
    <!-- Loading older messages spinner -->
    <div v-if="isLoading" class="flex justify-center py-2 shrink-0 mb-4">
      <div
        class="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-2"
      >
        <div
          class="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <span class="text-gray-500 font-medium text-[13px]"
          >Loading older messages...</span
        >
      </div>
    </div>

    <!-- Dynamic row rendering -->
    <ChatRow
      v-for="item in timelineItems"
      :key="item._id"
      :item="item"
      :ctx="ctx"
    />
  </div>
</template>
