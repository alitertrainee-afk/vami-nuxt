<script setup>
defineProps({
  users: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="flex items-center gap-2 px-4 py-2 shrink-0">
    <div class="flex items-center gap-1.5">
      <!-- Animated dots -->
      <div class="flex gap-0.5">
        <span
          class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style="animation-delay: 0ms"
        ></span>
        <span
          class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style="animation-delay: 150ms"
        ></span>
        <span
          class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style="animation-delay: 300ms"
        ></span>
      </div>
      <span class="text-xs text-gray-500 italic ml-1">typing...</span>
    </div>
  </div>
</template>
