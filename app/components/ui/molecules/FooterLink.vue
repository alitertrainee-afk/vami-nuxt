<script setup>
defineProps({
  text: String,
  linkText: String,
  to: String,
});
</script>

<template>
  <p class="mt-2 text-center text-sm text-gray-600">
    {{ text }}
    <NuxtLink
      :to="to"
      class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
    >
      {{ linkText }}
    </NuxtLink>
  </p>
</template>
