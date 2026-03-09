<script setup>
import { computed } from "vue";
import { DocumentAttachmentIcon, Download01Icon, Mic01Icon } from "hugeicons-vue";

const props = defineProps({
  message: { type: Object, required: true },
});

// Phase 3: message.type is one of: text | image | video | audio | voice | document
// Legacy: message.attachments[] (old format)

const mediaType = computed(() => {
  const t = props.message.type;
  if (t && t !== "text") return t;
  // Legacy fallback
  if (props.message.attachments?.length) {
    const first = props.message.attachments[0];
    if (first.type?.startsWith("image/")) return "image_legacy";
    if (first.type?.startsWith("video/")) return "video_legacy";
    if (first.type?.startsWith("audio/")) return "audio_legacy";
    return "document_legacy";
  }
  return "text";
});

const mediaUrl = computed(() => props.message.mediaUrl || null);
const thumbnailUrl = computed(() => props.message.thumbnailUrl || props.message.mediaUrl || null);

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getExtension(mime) {
  if (!mime) return "";
  return mime.split("/")[1]?.split(";")[0]?.toUpperCase() || "";
}

function downloadMedia() {
  if (!mediaUrl.value) return;
  const a = document.createElement("a");
  a.href = mediaUrl.value;
  a.download = props.message.mediaKey?.split("/").pop() || "file";
  a.click();
}
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">

    <!-- ── Deleted placeholder ────────────────────────────────────────── -->
    <p
      v-if="message.isDeleted"
      class="text-[14px] italic text-gray-400 select-none"
    >
      🚫 This message was deleted
    </p>

    <template v-else>

      <!-- ── Phase 3: Image ────────────────────────────────────────────── -->
      <div
        v-if="mediaType === 'image'"
        class="rounded-lg overflow-hidden cursor-pointer max-w-[280px]"
      >
        <img
          :src="thumbnailUrl"
          class="w-full h-auto object-cover hover:opacity-90 transition-opacity"
          loading="lazy"
          @error="(e) => e.target.style.display = 'none'"
        />
      </div>

      <!-- ── Phase 3: Video ────────────────────────────────────────────── -->
      <div
        v-else-if="mediaType === 'video'"
        class="rounded-lg overflow-hidden max-w-[280px]"
      >
        <video
          :src="mediaUrl"
          :poster="thumbnailUrl"
          controls
          preload="metadata"
          class="w-full h-auto rounded-lg"
        />
      </div>

      <!-- ── Phase 3: Audio / Voice ────────────────────────────────────── -->
      <div
        v-else-if="mediaType === 'audio' || mediaType === 'voice'"
        class="flex items-center gap-2 px-1 py-0.5 min-w-[180px]"
      >
        <div class="shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Mic01Icon :size="16" />
        </div>
        <audio
          :src="mediaUrl"
          controls
          preload="metadata"
          class="h-8 flex-1 min-w-0"
          style="filter: hue-rotate(210deg);"
        />
        <span
          v-if="message.mediaDuration"
          class="text-[11px] text-gray-500 shrink-0"
        >
          {{ Math.floor(message.mediaDuration / 60) }}:{{ String(message.mediaDuration % 60).padStart(2, '0') }}
        </span>
      </div>

      <!-- ── Phase 3: Document ─────────────────────────────────────────── -->
      <div
        v-else-if="mediaType === 'document'"
        class="flex items-center gap-3 p-3 bg-black/5 rounded-lg cursor-pointer hover:bg-black/10 transition-colors max-w-[280px]"
        @click="downloadMedia"
      >
        <div class="w-10 h-10 shrink-0 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
          <DocumentAttachmentIcon :size="24" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-medium text-gray-800 truncate">
            {{ message.mediaKey?.split("/").pop() || "Document" }}
          </p>
          <p class="text-[12px] text-gray-500 uppercase">
            {{ formatFileSize(message.mediaSize) }}
            <span v-if="message.mediaMimeType"> • {{ getExtension(message.mediaMimeType) }}</span>
          </p>
        </div>
        <Download01Icon :size="20" class="shrink-0 text-gray-400" />
      </div>

      <!-- ── Legacy: image_gallery ─────────────────────────────────────── -->
      <div
        v-else-if="mediaType === 'image_legacy'"
        class="grid gap-1 rounded-lg overflow-hidden"
        :class="(message.attachments?.filter(a => a.type?.startsWith('image/')).length ?? 0) > 1 ? 'grid-cols-2' : 'grid-cols-1'"
      >
        <div
          v-for="(img, i) in (message.attachments?.filter(a => a.type?.startsWith('image/')) ?? []).slice(0, 4)"
          :key="i"
          class="relative aspect-square bg-gray-200 cursor-pointer"
        >
          <img :src="img.url" class="w-full h-full object-cover hover:opacity-90 transition-opacity" />
          <div
            v-if="i === 3 && (message.attachments?.filter(a => a.type?.startsWith('image/')).length ?? 0) > 4"
            class="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-medium"
          >
            +{{ (message.attachments?.filter(a => a.type?.startsWith('image/')).length ?? 0) - 4 }}
          </div>
        </div>
      </div>

      <!-- ── Legacy: document_legacy ──────────────────────────────────── -->
      <div
        v-else-if="mediaType === 'document_legacy'"
        class="flex flex-col gap-1"
      >
        <div
          v-for="(file, i) in message.attachments?.filter(a => !a.type?.startsWith('image/'))"
          :key="i"
          class="flex items-center gap-3 p-3 bg-black/5 rounded-lg cursor-pointer hover:bg-black/10 transition-colors"
        >
          <div class="w-10 h-10 shrink-0 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <DocumentAttachmentIcon :size="24" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-medium text-gray-800 truncate">{{ file.name }}</p>
            <p class="text-[12px] text-gray-500 uppercase">{{ file.size }} • {{ file.extension }}</p>
          </div>
        </div>
      </div>

      <!-- ── Text / markdown ────────────────────────────────────────────── -->
      <template v-if="message.content">
        <div
          v-if="message.content.includes('```')"
          class="text-[14px] bg-[#f0f2f5] p-2 rounded-md font-mono text-gray-800 break-words overflow-x-auto"
        >
          {{ message.content }}
        </div>
        <p
          v-else
          class="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-[#111b21]"
        >
          {{ message.content }}
        </p>
      </template>

    </template>
  </div>
</template>
