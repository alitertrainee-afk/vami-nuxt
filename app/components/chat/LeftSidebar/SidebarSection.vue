<script setup>
// local imports
import { SECTION_REGISTRY } from "./config/section-registry.config.js";

const props = defineProps({
  item: { type: Object, required: true },
  ctx: { type: Object, required: true },
});

const entry = SECTION_REGISTRY[props.item.type];
</script>

<template>
  <component
    v-if="entry"
    :is="entry.component"
    v-bind="entry.resolveProps(item, ctx)"
  />
  <div v-else class="text-xs text-red-400 text-center py-1">
    Unknown section type: {{ item.type }}
  </div>
</template>
