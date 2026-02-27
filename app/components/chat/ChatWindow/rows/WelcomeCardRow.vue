<script setup>
import Avatar from "../../../ui/atoms/Avatar.vue";

defineProps({
  chatName: { type: String, required: true },
  avatarUrl: { type: String, default: null },
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-10 px-6 select-none">
    <div
      class="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm"
    >
      <Avatar
        :src="avatarUrl"
        :name="chatName"
        size="lg"
        class="w-full h-full"
      />
    </div>

    <h3 class="text-lg font-semibold text-gray-800 text-center">
      {{ chatName }}
    </h3>

    <p class="text-sm text-gray-500 mt-1 text-center max-w-xs">
      This is the beginning of your conversation. Say hello! 👋
    </p>

    <div class="mt-4 flex items-center gap-1.5">
      <div class="w-1.5 h-1.5 rounded-full bg-green-400"></div>
      <span class="text-xs text-gray-400 font-medium"
        >End-to-end encrypted</span
      >
    </div>
  </div>
</template>
