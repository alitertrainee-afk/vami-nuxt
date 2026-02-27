<script setup>
// UI Imports - [Atoms]
import Button from "../../../ui/atoms/Button.vue";

defineProps({
  showCta: { type: Boolean, default: false },
  onNewChat: { type: Function, default: null },
});
</script>

<template>
  <div class="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
    <span class="text-sm">No results found.</span>
    <Button
      v-if="showCta && onNewChat"
      variant="soft"
      size="sm"
      @click="onNewChat"
    >
      Start a new chat
    </Button>
  </div>
</template>
