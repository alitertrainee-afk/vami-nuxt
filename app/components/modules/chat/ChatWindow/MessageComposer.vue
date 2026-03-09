<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { AttachmentIcon, Cancel01Icon, ArrowUp01Icon } from "hugeicons-vue";
import { createChatService } from "../services/chat.service.js";

const emit = defineEmits(["send"]);
const messageInput = ref("");

// ── Store / socket ────────────────────────────────────────────────────────
const chatStore = useChatStore();
const socket = useSocket();

// ── Typing indicators ─────────────────────────────────────────────────────
let typingTimeout = null;
let isCurrentlyTyping = false;

function emitTyping() {
  if (!chatStore.activeChat) return;
  if (!isCurrentlyTyping) {
    isCurrentlyTyping = true;
    socket.emit("user_typing", { roomId: chatStore.activeChat._id });
  }
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isCurrentlyTyping = false;
    socket.emit("user_stopped_typing", { roomId: chatStore.activeChat._id });
  }, 2000);
}

function stopTyping() {
  if (isCurrentlyTyping && chatStore.activeChat) {
    clearTimeout(typingTimeout);
    isCurrentlyTyping = false;
    socket.emit("user_stopped_typing", { roomId: chatStore.activeChat._id });
  }
}

onBeforeUnmount(() => {
  stopTyping();
  clearTimeout(typingTimeout);
});

// ── Reply-to ──────────────────────────────────────────────────────────────
const replyingTo = computed(() => chatStore.replyingTo);

const replyPreview = computed(() => {
  const m = replyingTo.value;
  if (!m) return null;
  if (m.isDeleted) return "Deleted message";
  if (m.type && m.type !== "text") return `📎 ${m.type.charAt(0).toUpperCase() + m.type.slice(1)}`;
  return m.content?.slice(0, 80) || "";
});

function cancelReply() {
  chatStore.clearReplyingTo();
}

// ── Media Upload (Phase 3) ────────────────────────────────────────────────
const fileInputRef = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);

function openFilePicker() {
  fileInputRef.value?.click();
}

async function handleFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file || !chatStore.activeChat) return;
  e.target.value = "";          // allow re-selecting same file

  isUploading.value = true;
  uploadProgress.value = 0;

  try {
    const { apiFetch } = useApiFetch();
    const chatService = createChatService(apiFetch);

    // 1. Get presigned URL
    const presignRes = await chatService.requestPresignedUrl({
      mimetype: file.type,
      size: file.size,
    });
    const { uploadUrl, key: mediaKey, mediaUrl } = presignRes.data;

    // 2. PUT directly to S3
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    uploadProgress.value = 90;

    // 3. Confirm upload on backend
    await chatService.confirmUpload(mediaKey);
    uploadProgress.value = 100;

    // 4. Send message with media
    chatStore.sendMessage({
      content: messageInput.value.trim() || null,
      mediaKey,
      mediaUrl,
      mediaMimeType: file.type,
      mediaSize: file.size,
    });
    messageInput.value = "";
  } catch (err) {
    console.error("[MessageComposer] Upload failed:", err);
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
}

// ── Submit ─────────────────────────────────────────────────────────────────
function submit() {
  const text = messageInput.value.trim();
  if (!text) return;
  stopTyping();
  chatStore.sendMessage({ content: text });
  messageInput.value = "";
}
</script>

<template>
  <div class="bg-white border-t border-gray-200">

    <!-- ── Reply-to banner ───────────────────────────────────────────── -->
    <Transition name="slide-down">
      <div
        v-if="replyingTo"
        class="flex items-start gap-2 px-4 pt-2 pb-1 border-b border-gray-100 bg-gray-50"
      >
        <div class="flex-1 min-w-0">
          <p class="text-[12px] font-semibold text-indigo-600 mb-0.5">
            Replying to {{ replyingTo.sender?.username || "Unknown" }}
          </p>
          <p class="text-[13px] text-gray-500 truncate">{{ replyPreview }}</p>
        </div>
        <button
          class="shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
          @click="cancelReply"
        >
          <Cancel01Icon :size="16" class="text-gray-500" />
        </button>
      </div>
    </Transition>

    <!-- ── Upload progress bar ──────────────────────────────────────── -->
    <div v-if="isUploading" class="h-0.5 bg-gray-100">
      <div
        class="h-full bg-indigo-500 transition-all duration-300"
        :style="{ width: uploadProgress + '%' }"
      />
    </div>

    <!-- ── Input row ─────────────────────────────────────────────────── -->
    <form @submit.prevent="submit" class="flex items-end gap-2 p-4">

      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        @change="handleFileSelected"
      />

      <!-- Attachment button -->
      <button
        type="button"
        class="shrink-0 p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition-colors"
        :disabled="isUploading"
        @click="openFilePicker"
      >
        <AttachmentIcon :size="22" />
      </button>

      <!-- Text area -->
      <div
        class="flex-1 bg-gray-100 rounded-2xl border border-transparent focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all"
      >
        <textarea
          v-model="messageInput"
          rows="1"
          placeholder="Type a message..."
          class="w-full bg-transparent border-none focus:ring-0 py-3 px-4 resize-none outline-none text-sm max-h-32 overflow-y-auto rounded-2xl"
          @input="emitTyping"
          @keydown.enter.exact.prevent="submit"
        />
      </div>

      <!-- Send button -->
      <button
        type="submit"
        :disabled="!messageInput.trim() && !isUploading"
        class="shrink-0 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <ArrowUp01Icon :size="20" />
      </button>

    </form>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.15s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
