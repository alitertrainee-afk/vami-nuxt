<template>
  <script setup>
import { ref, computed } from "vue";
import {
  Copy01Icon, Link01Icon, LogoutSquare01Icon,
  Settings02Icon, UserRemove01Icon,
  UserAdd01Icon, Crown01Icon,
} from "hugeicons-vue";
import { Icon } from "@iconify/vue";
import Avatar from "../../../../ui/atoms/Avatar.vue";

const chatStore = useChatStore();
const authStore = useAuthStore();

const chat = computed(() => chatStore.activeChat);
const isGroup = computed(() => chat.value?.isGroupChat);
const currentUserId = computed(() => authStore.user?._id);

// Am I an admin of this group?
const isAdmin = computed(() => {
  if (!isGroup.value || !chat.value?.admins) return false;
  return chat.value.admins.some((a) => a?.toString() === currentUserId.value?.toString());
});

// Other user in DM
const otherUser = computed(() => {
  if (isGroup.value) return null;
  return chat.value?.participants?.find((p) => p._id?.toString() !== currentUserId.value?.toString());
});

const displayName = computed(() =>
  isGroup.value
    ? chat.value?.chatName
    : otherUser.value?.username || "Unknown",
);

const displayAvatar = computed(() =>
  isGroup.value ? chat.value?.groupAvatar : otherUser.value?.profile?.avatar,
);

// ── Group settings ────────────────────────────────────────────────────────
const onlyAdminsCanMessage = computed(() => chat.value?.onlyAdminsCanMessage ?? false);

async function toggleOnlyAdmins() {
  if (!isAdmin.value) return;
  try {
    await chatStore.updateGroupInfo(chat.value._id, {
      onlyAdminsCanMessage: !onlyAdminsCanMessage.value,
    });
  } catch (err) {
    console.error("Failed to update group setting:", err);
  }
}

// ── Disappearing messages ─────────────────────────────────────────────────
const DISAPPEAR_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
  { label: "90 days", value: 7776000 },
];
const currentDisappear = computed(() => chat.value?.disappearTimer ?? 0);

async function setDisappear(seconds) {
  try {
    const { apiFetch } = useApiFetch();
    const { createChatService } = await import("../../services/chat.service.js");
    const chatService = createChatService(apiFetch);
    await chatService.setDisappearTimer(chat.value._id, seconds);
    // Optimistic: reflect locally
    chatStore.activeChat = { ...chat.value, disappearTimer: seconds };
  } catch (err) {
    console.error("Failed to set disappear timer:", err);
  }
}

// ── Participant actions ───────────────────────────────────────────────────
async function promoteAdmin(userId) {
  await chatStore.promoteAdmin(chat.value._id, userId);
}
async function demoteAdmin(userId) {
  await chatStore.demoteAdmin(chat.value._id, userId);
}
async function removeMember(userId) {
  if (!confirm("Remove this member from the group?")) return;
  await chatStore.removeMember(chat.value._id, userId);
}

// ── Invite link ───────────────────────────────────────────────────────────
const inviteLink = computed(() => chatStore.groupInviteLink);
const isLoadingLink = ref(false);

async function generateLink() {
  isLoadingLink.value = true;
  try { await chatStore.generateInviteLink(chat.value._id); }
  catch (e) { console.error(e); }
  finally { isLoadingLink.value = false; }
}

async function revokeLink() {
  if (!confirm("Revoke invite link?")) return;
  await chatStore.revokeInviteLink(chat.value._id);
}

function copyLink() {
  if (inviteLink.value) navigator.clipboard?.writeText(inviteLink.value);
}

// ── Leave group ───────────────────────────────────────────────────────────
async function leaveGroup() {
  if (!confirm("Leave this group?")) return;
  try { await chatStore.leaveGroup(chat.value._id); }
  catch (e) { console.error(e); }
}

// ── Conversation participant settings ─────────────────────────────────────
async function toggleMute() {
  await chatStore.updateConversationSetting(chat.value._id, { isMuted: !chat.value.isMuted });
}
async function togglePin() {
  await chatStore.updateConversationSetting(chat.value._id, { isPinned: !chat.value.isPinned });
}
async function toggleArchive() {
  await chatStore.updateConversationSetting(chat.value._id, { isArchived: !chat.value.isArchived });
}
</script>

<template>
  <div v-if="chat" class="flex flex-col h-full overflow-y-auto bg-white">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col items-center gap-2 p-6 bg-gray-50 border-b border-gray-100">
      <Avatar :src="displayAvatar" :name="displayName" size="xl" />
      <h2 class="text-[18px] font-semibold text-gray-900 text-center">{{ displayName }}</h2>

      <!-- Group description -->
      <p v-if="isGroup && chat.description" class="text-[13px] text-gray-500 text-center max-w-xs">
        {{ chat.description }}
      </p>

      <!-- DM: online status -->
      <p v-if="!isGroup" class="text-[13px] text-gray-500">
        {{ chatStore.onlineUsers.has(otherUser?._id) ? '🟢 Online' : 'Offline' }}
      </p>

      <!-- Group: member count -->
      <p v-if="isGroup" class="text-[13px] text-gray-400">
        {{ chat.participants?.length || 0 }} members
      </p>
    </div>

    <!-- ── Quick action toggles ──────────────────────────────────────── -->
    <div class="flex justify-around px-4 py-3 border-b border-gray-100">
      <button
        class="flex flex-col items-center gap-1 text-[12px] text-gray-600 hover:text-indigo-600 transition-colors"
        @click="toggleMute"
      >
        <span class="text-[22px]">{{ chat.isMuted ? '🔕' : '🔔' }}</span>
        {{ chat.isMuted ? 'Unmute' : 'Mute' }}
      </button>
      <button
        class="flex flex-col items-center gap-1 text-[12px] text-gray-600 hover:text-indigo-600 transition-colors"
        @click="togglePin"
      >
        <span class="text-[22px]">{{ chat.isPinned ? '📌' : '📍' }}</span>
        {{ chat.isPinned ? 'Unpin' : 'Pin' }}
      </button>
      <button
        class="flex flex-col items-center gap-1 text-[12px] text-gray-600 hover:text-indigo-600 transition-colors"
        @click="toggleArchive"
      >
        <span class="text-[22px]">🗂️</span>
        {{ chat.isArchived ? 'Unarchive' : 'Archive' }}
      </button>
    </div>

    <!-- ── Disappearing messages ─────────────────────────────────────── -->
    <div class="px-4 py-3 border-b border-gray-100">
      <p class="text-[13px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Disappearing Messages</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in DISAPPEAR_OPTIONS"
          :key="opt.value"
          :class="[
            'px-3 py-1 rounded-full text-[13px] border transition-colors',
            currentDisappear === opt.value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400',
          ]"
          @click="setDisappear(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- ── Group-only sections ─────────────────────────────────────────── -->
    <template v-if="isGroup">

      <!-- Only admins can send -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p class="text-[14px] font-medium text-gray-800">Only admins can send</p>
          <p class="text-[12px] text-gray-500">Restrict messaging to group admins only</p>
        </div>
        <button
          :disabled="!isAdmin"
          :class="[
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            onlyAdminsCanMessage ? 'bg-indigo-600' : 'bg-gray-200',
            !isAdmin && 'opacity-50 cursor-not-allowed',
          ]"
          @click="toggleOnlyAdmins"
        >
          <span
            :class="[
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
              onlyAdminsCanMessage ? 'translate-x-5' : 'translate-x-0',
            ]"
          />
        </button>
      </div>

      <!-- Invite link -->
      <div class="px-4 py-3 border-b border-gray-100">
        <p class="text-[13px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Invite Link</p>
        <div v-if="inviteLink" class="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
          <p class="flex-1 text-[12px] text-gray-600 truncate font-mono">{{ inviteLink }}</p>
          <button class="text-indigo-600 hover:text-indigo-800 shrink-0" @click="copyLink">
            <Copy01Icon :size="16" />
          </button>
        </div>
        <div class="flex gap-2 mt-2">
          <button
            v-if="isAdmin"
            :disabled="isLoadingLink"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[13px] font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
            @click="generateLink"
          >
            <Link01Icon :size="14" />
            {{ inviteLink ? 'Refresh' : 'Generate' }}
          </button>
          <button
            v-if="isAdmin && inviteLink"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[13px] font-medium hover:bg-red-100 transition-colors"
            @click="revokeLink"
          >
            Revoke
          </button>
        </div>
      </div>

      <!-- Members list -->
      <div class="px-4 py-3">
        <p class="text-[13px] font-semibold text-gray-500 mb-3 uppercase tracking-wide">Members</p>
        <ul class="flex flex-col gap-1">
          <li
            v-for="member in (chat.participants || [])"
            :key="member._id"
            class="flex items-center gap-3 py-2 rounded-lg hover:bg-gray-50 px-2 group/member"
          >
            <Avatar :src="member?.profile?.avatar" :name="member?.username" size="sm" />
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-medium text-gray-800 truncate">
                {{ member.username }}
                <span v-if="member._id?.toString() === currentUserId?.toString()" class="text-gray-400 font-normal"> (You)</span>
              </p>
              <p
                v-if="(chat.admins || []).some(a => a?.toString() === member._id?.toString())"
                class="text-[11px] text-amber-600 flex items-center gap-0.5"
              >
                <Crown01Icon :size="11" /> Admin
              </p>
            </div>

            <!-- Admin actions (only for admins, not shown for self) -->
            <div
              v-if="isAdmin && member._id?.toString() !== currentUserId?.toString()"
              class="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity"
            >
              <!-- Promote/Demote -->
              <button
                v-if="!(chat.admins || []).some(a => a?.toString() === member._id?.toString())"
                class="p-1 rounded hover:bg-amber-100 text-amber-600 text-[11px]"
                title="Make admin"
                @click="promoteAdmin(member._id)"
              >
                <Crown01Icon :size="14" />
              </button>
              <button
                v-else
                class="p-1 rounded hover:bg-amber-100 text-amber-400 text-[11px]"
                title="Remove admin"
                @click="demoteAdmin(member._id)"
              >
                <Crown01Icon :size="14" class="opacity-40" />
              </button>
              <!-- Remove -->
              <button
                class="p-1 rounded hover:bg-red-100 text-red-500"
                title="Remove member"
                @click="removeMember(member._id)"
              >
                <UserRemove01Icon :size="14" />
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Leave group -->
      <div class="px-4 pb-6">
        <button
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-[14px] font-medium"
          @click="leaveGroup"
        >
          <LogoutSquare01Icon :size="18" />
          Leave Group
        </button>
      </div>

    </template>

  </div>

  <div v-else class="flex items-center justify-center h-full text-gray-400 text-[14px]">
    Select a chat to see info
  </div>
</template>

</template>
<script>
export default {};
</script>
<style lang=""></style>
