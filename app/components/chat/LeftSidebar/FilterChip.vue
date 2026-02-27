<script setup>
// libs imports
import { computed } from "vue";

// stores imports
import { useChatStore } from "~/stores/chat.store.js";

// UI Imports - [Atoms]
import Button from "../../ui/atoms/Button.vue";

// Config
import { SIDEBAR_FILTERS } from "./config/filter.config.js";

const chatStore = useChatStore();

// Merge config with reactive count from store
const filters = computed(() =>
  SIDEBAR_FILTERS.map((f) => ({
    ...f,
    count: f.countKey ? chatStore[f.countKey] : undefined,
  })),
);

const buttonVariant = (key) =>
  chatStore.activeFilter === key ? "soft-success" : "soft";
</script>

<template>
  <div
    class="flex items-center gap-2 p-3 overflow-x-auto scroll-hidden bg-white"
  >
    <Button
      v-for="filter in filters"
      :key="filter?.key"
      :variant="buttonVariant(filter?.key)"
      size="sm"
      rounded="2xl"
      @click="chatStore.setFilter(filter?.key)"
    >
      {{ filter?.label }}
      <span v-if="filter.count" class="ml-1 opacity-70">
        {{ filter?.count }}
      </span>
    </Button>
  </div>
</template>

<style scoped>
.scroll-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scroll-hidden::-webkit-scrollbar {
  display: none;
}
</style>
