<script setup>
definePageMeta({
  layout: "auth",
  middleware: "guest",
});

const handleSuccess = () => {
  navigateTo("/chat");
};
</script>

<template>
  <div>
    <h2 class="mt-6 text-3xl font-extrabold text-gray-900 text-center">
      Sign in to Vami
    </h2>
    <UiMoleculesFooterLink
      text="Or"
      linkText="create a new account"
      to="/register"
      class="text-center mt-1"
    />

    <div class="mt-6">
      <ModulesAuthLoginForm @success="handleSuccess" />
    </div>
  </div>
</template>
