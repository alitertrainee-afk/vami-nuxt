<script setup>
definePageMeta({
  layout: "default",
  middleware: "auth",
});
</script>

<template>
  <div>
    <div
      class="bg-white py-8 px-6 shadow-xl sm:rounded-xl border border-gray-100"
    >
      <h2 class="text-2xl font-extrabold text-gray-900 mb-6">
        Profile Settings
      </h2>
      <ModulesAuthProfileForm />
    </div>
  </div>
</template>
