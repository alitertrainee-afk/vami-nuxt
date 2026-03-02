<script setup>
import { Icon } from "@iconify/vue";

import MessageBubble from "../MessageBubble.vue";
import Avatar from "../../../../ui/atoms/Avatar.vue";

const props = defineProps({
  message: { type: Object, required: true },
  isMe: { type: Boolean, required: true },
  isFirstInCluster: { type: Boolean, default: true },
});

const senderName = computed(() => {
  if (props.isMe) return null;

  if (typeof props.message.sender === "object") {
    return props.message.sender?.username || null;
  }

  return props.message.senderName || null;
});

const senderAvatar = computed(() => {
  if (props.isMe) return null;

  if (typeof props.message.sender === "object") {
    return props.message.sender?.profile?.avatar || null;
  }

  return null;
});
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
    <div class="w-8 shrink-0 self-start mb-0.5">
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
      class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-75 self-center"
    >
      <button
        class="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
      >
        <Icon icon="tabler:mood-smile" class="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </div>
</template>
