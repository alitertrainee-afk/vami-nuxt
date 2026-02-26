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
      Create your account
    </h2>
    <UiMoleculesAuthFooterLink
      text="Already have an account?"
      linkText="Sign in"
      to="/login"
      class="text-center mt-1"
    />

    <div class="mt-6">
      <UiOrganismsRegisterForm @success="handleSuccess" />
    </div>
  </div>
</template>
