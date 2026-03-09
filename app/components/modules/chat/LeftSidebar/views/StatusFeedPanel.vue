<script setup>
import { ref, computed, onMounted } from "vue";
import { Cancel01Icon, Add01Icon, EyeIcon } from "hugeicons-vue";
import Avatar from "../../../../ui/atoms/Avatar.vue";

const authStore = useAuthStore();
const statusStore = useStatusStore();

// ── State ──────────────────────────────────────────────────────────────────
const viewingStatus = ref(null);       // { owner, statuses[], currentIndex }
const showCreateForm = ref(false);
const newStatusText = ref("");
const newStatusBg = ref("#075e54");
const fileInputRef = ref(null);
const isCreating = ref(false);

const BG_COLORS = ["#075e54", "#128c7e", "#25d366", "#34b7f1", "#e84393", "#ff6b6b", "#ffd93d", "#6c63ff"];

// ── Load on mount ──────────────────────────────────────────────────────────
onMounted(async () => {
  await statusStore.loadFeed();
  await statusStore.loadMyStatuses();
});

// ── Viewers ────────────────────────────────────────────────────────────────
const currentStatus = computed(() =>
  viewingStatus.value
    ? viewingStatus.value.statuses[viewingStatus.value.currentIndex]
    : null,
);

function openStatusViewer(owner, statuses) {
  viewingStatus.value = { owner, statuses, currentIndex: 0 };
  // mark as viewed
  if (currentStatus.value?._id) {
    statusStore.viewStatus(currentStatus.value._id).catch(() => {});
  }
}

function nextStatus() {
  if (!viewingStatus.value) return;
  const { statuses, currentIndex } = viewingStatus.value;
  if (currentIndex < statuses.length - 1) {
    viewingStatus.value = { ...viewingStatus.value, currentIndex: currentIndex + 1 };
    if (currentStatus.value?._id) {
      statusStore.viewStatus(currentStatus.value._id).catch(() => {});
    }
  } else {
    viewingStatus.value = null;
  }
}

function prevStatus() {
  if (!viewingStatus.value || viewingStatus.value.currentIndex === 0) return;
  viewingStatus.value = { ...viewingStatus.value, currentIndex: viewingStatus.value.currentIndex - 1 };
}

function closeViewer() {
  viewingStatus.value = null;
}

// ── Create status ──────────────────────────────────────────────────────────
async function createTextStatus() {
  if (!newStatusText.value.trim()) return;
  isCreating.value = true;
  try {
    await statusStore.createStatus({
      type: "text",
      content: newStatusText.value.trim(),
      backgroundColor: newStatusBg.value,
    });
    newStatusText.value = "";
    showCreateForm.value = false;
  } catch (err) {
    console.error("Create status failed:", err);
  } finally {
    isCreating.value = false;
  }
}

async function handleImageStatusFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = "";
  isCreating.value = true;
  try {
    // Upload via presign (reuse chat service pattern)
    const { apiFetch } = useApiFetch();
    const { createChatService } = await import("../../services/chat.service.js");
    const chatService = createChatService(apiFetch);
    const presignRes = await chatService.requestPresignedUrl({ fileName: file.name, mimeType: file.type, fileSize: file.size });
    const { uploadUrl, mediaKey, mediaUrl } = presignRes.data;
    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    await chatService.confirmUpload({ mediaKey, mimeType: file.type, size: file.size });
    await statusStore.createStatus({ type: "image", mediaKey, mediaUrl });
    showCreateForm.value = false;
  } catch (err) {
    console.error("Image status failed:", err);
  } finally {
    isCreating.value = false;
  }
}

async function deleteMyStatus(statusId) {
  if (!confirm("Delete this status?")) return;
  await statusStore.deleteStatus(statusId);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Group feed by user
const feedByUser = computed(() => {
  const map = new Map();
  for (const status of statusStore.statuses) {
    const uid = status.user?._id?.toString();
    if (!uid) continue;
    if (!map.has(uid)) map.set(uid, { user: status.user, statuses: [] });
    map.get(uid).statuses.push(status);
  }
  return [...map.values()];
});
</script>

<template>
  <div class="flex flex-col h-full bg-white overflow-hidden">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <h3 class="text-[16px] font-semibold text-gray-900">Status</h3>
      <button
        class="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        @click="showCreateForm = !showCreateForm"
      >
        <Add01Icon :size="20" class="text-indigo-600" />
      </button>
    </div>

    <!-- ── Create status form ─────────────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="showCreateForm" class="border-b border-gray-100 p-4 bg-gray-50">
        <p class="text-[13px] font-semibold text-gray-600 mb-3">New Status</p>

        <!-- Color picker -->
        <div class="flex gap-1.5 mb-3">
          <button
            v-for="color in BG_COLORS"
            :key="color"
            class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
            :style="{ backgroundColor: color, borderColor: newStatusBg === color ? 'white' : 'transparent' }"
            :class="newStatusBg === color ? 'ring-2 ring-offset-1 ring-indigo-500' : ''"
            @click="newStatusBg = color"
          />
        </div>

        <!-- Text input -->
        <textarea
          v-model="newStatusText"
          rows="2"
          placeholder="What's on your mind?"
          class="w-full rounded-xl border border-gray-200 p-3 text-[14px] resize-none focus:ring-2 focus:ring-indigo-400 outline-none mb-3"
        />

        <div class="flex items-center gap-2">
          <button
            :disabled="isCreating || !newStatusText.trim()"
            class="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[14px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            @click="createTextStatus"
          >
            Post Text
          </button>

          <!-- Hidden file input -->
          <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleImageStatusFile" />
          <button
            :disabled="isCreating"
            class="py-2 px-4 bg-gray-200 text-gray-700 rounded-xl text-[14px] font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            @click="fileInputRef?.click()"
          >
            📷 Photo
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── My statuses ────────────────────────────────────────────────── -->
    <div
      v-if="statusStore.myStatuses.length"
      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
      @click="openStatusViewer(authStore.user, statusStore.myStatuses)"
    >
      <div class="relative shrink-0">
        <div class="p-0.5 rounded-full bg-linear-to-tr from-indigo-400 to-purple-500">
          <Avatar :src="authStore.user?.profile?.avatar" :name="authStore.user?.username" size="md" class="border-2 border-white rounded-full" />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[14px] font-semibold text-gray-800">My Status</p>
        <p class="text-[12px] text-gray-500">{{ statusStore.myStatuses.length }} update{{ statusStore.myStatuses.length > 1 ? 's' : '' }}</p>
      </div>
      <button class="text-red-400 hover:text-red-600 text-[11px]" @click.stop="deleteMyStatus(statusStore.myStatuses[0]._id)">Delete</button>
    </div>

    <!-- Add my first status -->
    <div
      v-else
      class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
      @click="showCreateForm = true"
    >
      <div class="relative shrink-0">
        <Avatar :src="authStore.user?.profile?.avatar" :name="authStore.user?.username" size="md" />
        <div class="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center border border-white">
          <Add01Icon :size="10" class="text-white" />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-[14px] font-semibold text-gray-800">My Status</p>
        <p class="text-[12px] text-gray-500">Tap to add status update</p>
      </div>
    </div>

    <!-- ── Recent updates ─────────────────────────────────────────────── -->
    <div class="flex-1 overflow-y-auto">
      <p v-if="statusStore.statuses.length" class="text-[12px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2">
        Recent updates
      </p>

      <div
        v-for="entry in feedByUser"
        :key="entry.user._id"
        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
        @click="openStatusViewer(entry.user, entry.statuses)"
      >
        <div class="p-0.5 rounded-full bg-linear-to-tr from-green-400 to-indigo-500 shrink-0">
          <Avatar :src="entry.user?.profile?.avatar" :name="entry.user?.username" size="md" class="border-2 border-white rounded-full" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-medium text-gray-800 truncate">{{ entry.user.username }}</p>
          <p class="text-[12px] text-gray-500">{{ formatTime(entry.statuses[0].createdAt) }}</p>
        </div>
        <EyeIcon :size="16" class="text-gray-400 shrink-0" />
      </div>

      <p v-if="!statusStore.isLoading && !statusStore.statuses.length && !statusStore.myStatuses.length" class="text-center text-gray-400 text-[13px] py-8">
        No status updates yet
      </p>
    </div>

    <!-- ── Full-screen status viewer ─────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="viewingStatus && currentStatus"
          class="fixed inset-0 z-50 bg-black flex flex-col"
          @click.self="closeViewer"
        >
          <!-- Progress bars -->
          <div class="flex gap-1 px-3 pt-3">
            <div
              v-for="(s, i) in viewingStatus.statuses"
              :key="s._id"
              class="flex-1 h-0.5 rounded-full bg-white/40"
            >
              <div
                :class="['h-full rounded-full bg-white', i < viewingStatus.currentIndex ? 'w-full' : 'w-0']"
              />
            </div>
          </div>

          <!-- Owner header -->
          <div class="flex items-center gap-3 px-3 py-2">
            <Avatar :src="viewingStatus.owner?.profile?.avatar" :name="viewingStatus.owner?.username" size="sm" />
            <div>
              <p class="text-white text-[14px] font-semibold">{{ viewingStatus.owner.username }}</p>
              <p class="text-white/70 text-[12px]">{{ formatTime(currentStatus.createdAt) }}</p>
            </div>
            <button class="ml-auto p-2" @click="closeViewer">
              <Cancel01Icon :size="20" class="text-white" />
            </button>
          </div>

          <!-- Content -->
          <div
            class="flex-1 flex items-center justify-center cursor-pointer"
            :style="currentStatus.type === 'text' ? { backgroundColor: currentStatus.backgroundColor || '#075e54' } : {}"
            @click="nextStatus"
          >
            <!-- Text status -->
            <p v-if="currentStatus.type === 'text'" class="text-white text-[22px] font-medium px-8 text-center leading-relaxed">
              {{ currentStatus.content }}
            </p>
            <!-- Image status -->
            <img
              v-else-if="currentStatus.type === 'image'"
              :src="currentStatus.mediaUrl"
              class="max-h-full max-w-full object-contain"
              @error="(e) => e.target.style.display = 'none'"
            />
            <!-- Video status -->
            <video
              v-else-if="currentStatus.type === 'video'"
              :src="currentStatus.mediaUrl"
              autoplay
              loop
              class="max-h-full max-w-full"
              @click.stop
            />
          </div>

          <!-- Nav prev -->
          <div
            class="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
            @click.stop="prevStatus"
          />

          <!-- View count -->
          <div class="flex items-center gap-1 px-4 pb-4">
            <EyeIcon :size="16" class="text-white/70" />
            <span class="text-white/70 text-[13px]">{{ currentStatus.viewCount || 0 }} views</span>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.15s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
