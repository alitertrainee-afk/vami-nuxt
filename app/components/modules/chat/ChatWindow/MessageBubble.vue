<script setup>
import { computed } from "vue";
import { TickDouble02Icon, Tick01Icon, Clock01Icon } from "hugeicons-vue";
import MessageContent from "./MessageContent.vue";

const props = defineProps({
  message:          { type: Object,  required: true },
  isMe:             { type: Boolean, required: true },
  isFirstInCluster: { type: Boolean, default: true },
  senderName:       { type: String,  default: null },
});

const formattedTime = computed(() => {
  if (!props.message.createdAt) return "";
  return new Date(props.message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
});

// ── Tick state ────────────────────────────────────────────────────────────
// sending → optimistic (clock icon)
// sent    → single gray tick
// delivered → double gray tick
// read    → double blue tick
const tickState = computed(() => {
  if (!props.isMe) return null;
  const s = props.message.status;
  if (!s || s === "sending") return "sending";
  if (s === "sent")          return "sent";
  if (s === "delivered")     return "delivered";
  if (s === "read")          return "read";
  return "sent";
});

// ── Reactions ─────────────────────────────────────────────────────────────
// reactions: [{emoji, userId}] → group by emoji
const reactionGroups = computed(() => {
  const reactions = props.message.reactions;
  if (!reactions?.length) return [];
  const map = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = 0;
    map[r.emoji]++;
  }
  return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
});

// ── Reply-to ──────────────────────────────────────────────────────────────
const replyTo = computed(() => props.message.replyTo || null);
const replyContent = computed(() => {
  if (!replyTo.value) return null;
  const m = replyTo.value;
  if (m.isDeleted)   return "Deleted message";
  if (m.type && m.type !== "text") return `📎 ${m.type.charAt(0).toUpperCase() + m.type.slice(1)}`;
  return m.content?.slice(0, 80) || "";
});
</script>

<template>
  <div
    :class="[
      'relative isolate flex flex-col px-2.5 py-1.5 shadow-sm',
      isMe ? 'bg-[#d9fdd3]' : 'bg-white',
      isFirstInCluster
        ? isMe ? 'rounded-l-lg rounded-br-lg' : 'rounded-r-lg rounded-bl-lg'
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
      <path d="M12 0 L1 0 Q0 0 0 1 L12 12 Z" fill="white" />
    </svg>

    <!-- RIGHT TAIL -->
    <svg
      v-if="isMe && isFirstInCluster"
      viewBox="0 0 12 12"
      class="absolute -z-10 top-0 -right-2 w-3 h-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.08)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0 L11 0 Q12 0 12 1 L0 12 Z" fill="#d9fdd3" />
    </svg>

    <!-- Sender Name (group messages only) -->
    <div
      v-if="!isMe && isFirstInCluster && senderName"
      class="text-[13px] font-medium text-indigo-500 mb-0.5 truncate"
    >
      {{ senderName }}
    </div>

    <!-- ── Phase 2: Reply-to quote ─────────────────────────────────── -->
    <div
      v-if="replyTo"
      :class="[
        'border-l-4 rounded pl-2 py-1 mb-1.5 text-[13px] max-w-70',
        isMe ? 'border-green-600 bg-[#c6f4c0]' : 'border-indigo-400 bg-gray-100',
      ]"
    >
      <p class="font-semibold text-indigo-600 truncate text-[12px] leading-none mb-0.5">
        {{ replyTo.sender?.username || "Unknown" }}
      </p>
      <p class="text-gray-600 line-clamp-2">{{ replyContent }}</p>
    </div>

    <!-- Message content -->
    <MessageContent :message="message" />

    <!-- ── Meta row (time + edited + ticks) ──────────────────────── -->
    <div class="flex items-center justify-end gap-1 mt-1 -mb-1 ml-4 select-none">
      <!-- Edited label -->
      <span v-if="message.isEdited && !message.isDeleted" class="text-[11px] text-gray-400 italic">
        Edited
      </span>

      <span class="text-[11px] text-gray-500 whitespace-nowrap">
        {{ formattedTime }}
      </span>

      <!-- Tick state (own messages only) -->
      <div v-if="isMe" class="shrink-0">
        <!-- sending = clock -->
        <Clock01Icon v-if="tickState === 'sending'" :size="14" class="text-gray-400 animate-pulse" />
        <!-- sent = single tick -->
        <Tick01Icon v-else-if="tickState === 'sent'" :size="16" class="text-gray-400" />
        <!-- delivered = double tick gray -->
        <TickDouble02Icon v-else-if="tickState === 'delivered'" :size="16" class="text-gray-400" />
        <!-- read = double tick blue -->
        <TickDouble02Icon v-else-if="tickState === 'read'" :size="16" class="text-blue-500" />
      </div>
    </div>

    <!-- ── Phase 2: Reactions bar ─────────────────────────────────── -->
    <div
      v-if="reactionGroups.length"
      class="flex flex-wrap gap-0.5 mt-1.5 -mb-1"
    >
      <span
        v-for="group in reactionGroups"
        :key="group.emoji"
        class="inline-flex items-center gap-0.5 bg-white/80 border border-gray-200 rounded-full px-1.5 py-0.5 text-[12px] shadow-xs cursor-pointer select-none hover:bg-gray-100 transition-colors"
      >
        {{ group.emoji }}
        <span v-if="group.count > 1" class="text-gray-600 font-medium">{{ group.count }}</span>
      </span>
    </div>

  </div>
</template>
