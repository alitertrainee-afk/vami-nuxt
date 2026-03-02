<script setup>
// icons import
import { TickDouble02Icon, Tick01Icon } from "hugeicons-vue";

// components imports
import MessageContent from "./MessageContent.vue";

const props = defineProps({
  message: { type: Object, required: true },
  isMe: { type: Boolean, required: true },
  isFirstInCluster: { type: Boolean, default: true },
  senderName: { type: String, default: null },
});

const formattedTime = new Date(props.message.createdAt).toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});

const isRead = props.message.status === "read";
</script>

<template>
  <div
    :class="[
      'relative isolate flex flex-col px-2.5 py-1.5 shadow-sm',
      isMe ? 'bg-[#d9fdd3]' : 'bg-white',
      isFirstInCluster
        ? isMe
          ? 'rounded-l-lg rounded-br-lg'
          : 'rounded-r-lg rounded-bl-lg'
        : 'rounded-lg',
    ]"
  >
    <!-- LEFT TAIL -->
    <svg
      v-if="!isMe && isFirstInCluster"
      viewBox="0 0 12 12"
      class="absolute -z-10 top-0 -left-2 w-3 h-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.08)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 0 
         L1 0 
         Q0 0 0 1 
         L12 12 
         Z"
        fill="white"
      />
    </svg>

    <!-- RIGHT TAIL -->
    <svg
      v-if="isMe && isFirstInCluster"
      viewBox="0 0 12 12"
      class="absolute -z-10 top-0 -right-2 w-3 h-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.08)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0
         L11 0
         Q12 0 12 1
         L0 12
         Z"
        fill="#d9fdd3"
      />
    </svg>

    <!-- Sender Name -->
    <div
      v-if="!isMe && isFirstInCluster && senderName"
      class="text-[13px] font-medium text-indigo-500 mb-0.5 truncate"
    >
      {{ senderName }}
    </div>

    <MessageContent :message="message" />

    <div
      class="flex items-center justify-end gap-1 mt-1 -mb-1 ml-4 select-none"
    >
      <span class="text-[11px] text-gray-500 whitespace-nowrap">
        {{ formattedTime }}
      </span>

      <div v-if="isMe" class="shrink-0">
        <TickDouble02Icon v-if="isRead" :size="16" class="text-blue-500" />
        <Tick01Icon v-else :size="16" class="text-gray-400" />
      </div>
    </div>
  </div>
</template>
