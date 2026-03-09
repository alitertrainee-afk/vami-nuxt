<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import MessageBubble from "../MessageBubble.vue";
import Avatar from "../../../../ui/atoms/Avatar.vue";

const props = defineProps({
  message:          { type: Object,  required: true },
  isMe:             { type: Boolean, required: true },
  isFirstInCluster: { type: Boolean, default: true },
});

const chatStore = useChatStore();

// ── Sender info ───────────────────────────────────────────────────────────
const senderName = computed(() => {
  if (props.isMe) return null;
  if (typeof props.message.sender === "object") return props.message.sender?.username || null;
  return props.message.senderName || null;
});

const senderAvatar = computed(() => {
  if (props.isMe) return null;
  if (typeof props.message.sender === "object") return props.message.sender?.profile?.avatar || null;
  return null;
});

// ── Quick reactions (6 most common) ──────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const showEmojiPicker = ref(false);
const showContextMenu = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });

function toggleEmojiPicker(e) {
  e.stopPropagation();
  showContextMenu.value = false;
  showEmojiPicker.value = !showEmojiPicker.value;
}

function sendReaction(emoji) {
  chatStore.reactToMessage(props.message._id, emoji);
  showEmojiPicker.value = false;
}

// ── Context menu ─────────────────────────────────────────────────────────
function onRightClick(e) {
  e.preventDefault();
  showEmojiPicker.value = false;
  contextMenuPos.value = { x: e.clientX, y: e.clientY };
  showContextMenu.value = true;
}

function closeMenus() {
  showEmojiPicker.value = false;
  showContextMenu.value = false;
}

// Close on outside click
onMounted(() => document.addEventListener("click", closeMenus));
onBeforeUnmount(() => document.removeEventListener("click", closeMenus));

// ── Context actions ───────────────────────────────────────────────────────
function doReply() {
  chatStore.setReplyingTo(props.message);
  closeMenus();
}

function doCopy() {
  if (props.message.content) navigator.clipboard?.writeText(props.message.content);
  closeMenus();
}

function doEdit() {
  const newContent = window.prompt("Edit message:", props.message.content);
  if (newContent !== null && newContent.trim()) {
    chatStore.editMessage(props.message._id, newContent.trim());
  }
  closeMenus();
}

function doDeleteForMe() {
  chatStore.deleteMessage(props.message._id, "me");
  closeMenus();
}

function doDeleteForEveryone() {
  chatStore.deleteMessage(props.message._id, "everyone");
  closeMenus();
}

async function doStar() {
  if (props.message.isStarred) {
    await chatStore.unstarMessage(props.message._id);
  } else {
    await chatStore.starMessage(props.message._id);
  }
  closeMenus();
}

// Whether the message can be edited — only own messages, not deleted
const canEdit = computed(() =>
  props.isMe && !props.message.isDeleted && props.message.type === "text",
);
</script>

<template>
  <div
    :class="[
      'group flex w-full items-end gap-2',
      isMe ? 'flex-row-reverse' : 'flex-row',
      isFirstInCluster ? 'mt-3' : 'mt-0.5',
    ]"
    @contextmenu.prevent="onRightClick"
  >
    <!-- Avatar zone -->
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

    <!-- Hover: emoji quick picker toggle -->
    <div
      class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-75 self-center relative"
    >
      <button
        class="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
        @click.stop="toggleEmojiPicker"
      >
        <Icon icon="tabler:mood-smile" class="w-5 h-5 text-gray-600" />
      </button>

      <!-- Quick emoji popup -->
      <Transition name="scale-fade">
        <div
          v-if="showEmojiPicker"
          :class="[
            'absolute bottom-9 z-40 flex items-center gap-1 bg-white rounded-full shadow-xl px-2 py-1 border border-gray-100',
            isMe ? 'right-0' : 'left-0',
          ]"
          @click.stop
        >
          <button
            v-for="emoji in QUICK_EMOJIS"
            :key="emoji"
            class="text-[20px] hover:scale-125 transition-transform cursor-pointer select-none leading-none px-0.5"
            @click="sendReaction(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </Transition>
    </div>
  </div>

  <!-- ── Context menu (right-click) ───────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="scale-fade">
      <div
        v-if="showContextMenu"
        class="fixed z-50 min-w-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 text-[14px]"
        :style="{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }"
        @click.stop
      >
        <button
          class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          @click="doReply"
        >
          <Icon icon="tabler:arrow-back-up" class="w-4 h-4" />
          Reply
        </button>

        <button
          v-if="!message.isDeleted"
          class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          @click="toggleEmojiPicker"
        >
          <Icon icon="tabler:mood-smile" class="w-4 h-4" />
          React
        </button>

        <button
          v-if="message.content && !message.isDeleted"
          class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          @click="doCopy"
        >
          <Icon icon="tabler:copy" class="w-4 h-4" />
          Copy
        </button>

        <button
          v-if="canEdit"
          class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          @click="doEdit"
        >
          <Icon icon="tabler:pencil" class="w-4 h-4" />
          Edit
        </button>

        <button
          class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          @click="doStar"
        >
          <Icon :icon="message.isStarred ? 'tabler:star-filled' : 'tabler:star'" class="w-4 h-4" />
          {{ message.isStarred ? "Unstar" : "Star" }}
        </button>

        <div class="my-1 border-t border-gray-100" />

        <button
          class="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-500"
          @click="doDeleteForMe"
        >
          <Icon icon="tabler:trash" class="w-4 h-4" />
          Delete for me
        </button>

        <button
          v-if="isMe && !message.isDeleted"
          class="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
          @click="doDeleteForEveryone"
        >
          <Icon icon="tabler:trash-x" class="w-4 h-4" />
          Delete for everyone
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
