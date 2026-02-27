<script setup>
import MessageBubble from "../MessageBubble.vue";
import Avatar from "../../../ui/atoms/Avatar.vue";

const props = defineProps({
  message: { type: Object, required: true },
  isMe: { type: Boolean, required: true },
  isFirstInCluster: { type: Boolean, default: true },
});

const senderName = (() => {
  if (props.isMe) return null;
  if (typeof props.message.sender === "object") {
    return props.message.sender?.username || null;
  }
  return props.message.senderName || null;
})();

const senderAvatar = (() => {
  if (props.isMe) return null;
  if (typeof props.message.sender === "object") {
    return props.message.sender?.profile?.avatar || null;
  }
  return null;
})();
</script>

<template>
  <div
    :class="[
      'group flex w-full items-end gap-2',
      isMe ? 'flex-row-reverse' : 'flex-row',
      isFirstInCluster ? 'mt-3' : 'mt-0.5',
    ]"
  >
    <!-- Avatar zone (only other users, first in cluster) -->
    <div class="w-8 shrink-0 self-end mb-0.5">
      <Avatar
        v-if="!isMe && isFirstInCluster"
        :src="senderAvatar"
        :name="senderName"
        size="sm"
      />
    </div>

    <!-- Bubble -->
    <div class="relative min-w-0 max-w-[85%] md:max-w-[75%] lg:max-w-[65%]">
      <MessageBubble
        :message="message"
        :isMe="isMe"
        :isFirstInCluster="isFirstInCluster"
        :senderName="senderName"
      />
    </div>

    <!-- Hover actions zone -->
    <div
      class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 self-center"
    >
      <button
        class="p-1 rounded-full hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
        title="React"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
