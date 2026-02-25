<script setup>
import { toRefs, computed } from "vue";
import { useChatScroll } from "~/composables/useChatScroll.js";

// Import all your row components
import MessageBubble from "./MessageBubble.vue";
import DateSeparator from "./DateSeparator.vue";
import SystemAlert from "./SystemAlert.vue";

const props = defineProps({
  messages: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  hasNext: { type: Boolean, default: false },
  currentUserId: { type: String, required: true },
  loadMore: { type: Function, required: true },
});

const { messages, hasNext } = toRefs(props);

const { messagesContainer } = useChatScroll({
  messages,
  hasNext,
  loadMore: props.loadMore,
});

const isMe = (senderId) => {
  const id = typeof senderId === "object" ? senderId?._id : senderId;
  return id === props.currentUserId;
};

// --- CONFIGURATION REGISTRY ---
const COMPONENT_MAP = {
  message: MessageBubble,
  date_separator: DateSeparator,
  system_alert: SystemAlert,
};

// --- DYNAMIC PROP RESOLVER ---
const resolveProps = (item) => {
  if (item.type === "message") {
    return {
      message: item,
      isMe: isMe(item.sender),
      isFirstInCluster: item.isFirstInCluster,
      class: "mb-1",
    };
  }

  return { item };
};

// --- HELPER: Date Formatter ---
const formatDateLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

// --- TIMELINE PROCESSOR ---
const chatTimeline = computed(() => {
  const timeline = [];
  let lastDate = null;
  let lastSenderId = null;

  messages.value.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    const senderId =
      typeof msg.sender === "object" ? msg.sender?._id : msg.sender;

    if (msgDate !== lastDate) {
      timeline.push({
        _id: `date-${msgDate}`,
        type: "date_separator",
        label: formatDateLabel(msg.createdAt),
      });
      lastDate = msgDate;
      lastSenderId = null;
    }

    if (msg.isSystemMessage) {
      timeline.push({ ...msg, type: "system_alert" });
      lastSenderId = null;
      return;
    }

    const isFirstInCluster = senderId !== lastSenderId;

    timeline.push({
      ...msg,
      type: "message",
      isFirstInCluster,
    });

    lastSenderId = senderId;
  });

  return timeline;
});
</script>

<template>
  <div
    ref="messagesContainer"
    class="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col relative custom-scrollbar z-10"
  >
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

    <component
      v-for="item in chatTimeline"
      :key="item._id"
      :is="COMPONENT_MAP[item.type]"
      v-bind="resolveProps(item)"
    />
  </div>
</template>
