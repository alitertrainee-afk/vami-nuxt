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
  hasPrev: { type: Boolean, default: false },
  currentUserId: { type: String, required: true },
  activeChat: { type: Object, default: null },
  typingUsers: { type: Set, default: () => new Set() },
  loadMore: { type: Function, required: true },
  jumpToLatest: { type: Function, required: true },
});

const messagesRef = toRef(props, "messages");
const hasNextRef = toRef(props, "hasNext");
const hasPrevRef = toRef(props, "hasPrev");
const currentUserIdRef = toRef(props, "currentUserId");
const activeChatRef = toRef(props, "activeChat");
const typingUsersRef = toRef(props, "typingUsers");

const {
  containerRef,
  timelineItems,
  scrollToBottom,
  handleJumpToBottom,
  showScrollToBottom,
} = useChatBody({
  messages: messagesRef,
  hasNext: hasNextRef,
  hasPrev: hasPrevRef,
  loadMore: props.loadMore,
  jumpToLatest: props.jumpToLatest,
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
  <div class="relative flex-1 min-h-0 flex flex-col">
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

    <Transition name="slide-up">
      <div
        v-if="showScrollToBottom"
        class="absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-none"
      >
        <button
          @click="handleJumpToBottom"
          class="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white active:scale-95 transition-all duration-150"
          aria-label="Jump to latest messages"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 3a.75.75 0 01.75.75v10.19l3.72-3.72a.75.75 0 111.06 1.06l-5 5a.75.75 0 01-1.06 0l-5-5a.75.75 0 111.06-1.06l3.72 3.72V3.75A.75.75 0 0110 3z"
              clip-rule="evenodd"
            />
          </svg>

          <span>Jump to bottom</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0%);
  opacity: 1;
}
</style>
