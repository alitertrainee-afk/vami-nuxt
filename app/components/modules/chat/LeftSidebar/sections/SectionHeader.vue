<script setup>
defineProps({
  label: { type: String, required: true },
});
</script>

<template>
  <div
    class="px-4 py-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase bg-gray-50"
  >
    {{ label }}
  </div>
</template>
