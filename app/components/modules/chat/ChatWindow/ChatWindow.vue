<script setup>
// libs imports
import { ref, computed, watch } from "vue";

// components imports
import ChatHeader from "./ChatHeader.vue";
import ChatBody from "./ChatBody.vue";
import MessageComposer from "./MessageComposer.vue";
import ConnectionBanner from "./ConnectionBanner.vue";

const chatStore = useChatStore();
const authStore = useAuthStore();

const chatBodyRef = ref(null);

defineEmits(["back", "toggle-info"]);

const handleLoadMore = () => {
  return chatStore.loadMoreMessages();
};

const currentUserId = computed(() => authStore.user?._id);
const typingUsers = computed(() => chatStore.typingUsers);

// Auto-scroll to bottom when a new optimistic message appears (own send)
watch(
  () => chatStore.messages.length,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      const last = chatStore.messages[chatStore.messages.length - 1];
      if (last?._optimistic) {
        chatBodyRef.value?.scrollToBottom?.();
      }
    }
  },
);
</script>

<template>
  <section
    class="flex flex-col h-full w-full relative bg-[#efeae2] overflow-hidden z-0"
  >
    <div
      class="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[url('/chat-bg-pattern.png')] bg-repeat"
    ></div>

    <header class="shrink-0 z-20 w-full shadow-sm">
      <ChatHeader @back="$emit('back')" @toggle-info="$emit('toggle-info')" />
      <ConnectionBanner />
    </header>

    <main class="flex-1 min-h-0 min-w-0 relative z-10 flex flex-col">
      <ChatBody
        ref="chatBodyRef"
        :messages="chatStore.messages"
        :isLoading="chatStore.isLoadingMessages"
        :hasNext="chatStore.pagination?.hasNext"
        :hasPrev="chatStore.pagination?.hasPrev ?? false"
        :currentUserId="currentUserId"
        :activeChat="chatStore.activeChat"
        :typingUsers="typingUsers"
        :loadMore="handleLoadMore"
        :jumpToLatest="() => chatStore.jumpToLatest()"
        class="flex-1"
      />
    </main>

    <footer class="shrink-0 z-20 w-full bg-white">
      <MessageComposer />
    </footer>
  </section>
</template>
