<script setup>
import { ROW_REGISTRY } from "./config/row-registry.config.js";

const props = defineProps({
  item: { type: Object, required: true },
  ctx: { type: Object, required: true },
});

// Messages use _row to avoid shadowing the message's own `type` field.
// All other timeline items (date_separator, typing, etc.) still use `type`.
const entry = ROW_REGISTRY[props.item._row ?? props.item.type];
</script>

<template>
  <component
    v-if="entry"
    :is="entry.component"
    v-bind="entry.resolveProps(item, ctx)"
  />
  <div v-else class="text-xs text-red-400 text-center py-1">
    Unknown row type: {{ item.type }}
  </div>
</template>
