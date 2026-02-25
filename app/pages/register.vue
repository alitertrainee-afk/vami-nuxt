<script setup>
definePageMeta({
  middleware: "guest",
});

const handleSuccess = () => {
  navigateTo("/chat");
};
</script>

<template>
  <UiTemplatesAuthTemplate title="Create your account">
    <template #subtitle>
      <UiMoleculesAuthFooterLink
        text="Already have an account?"
        linkText="Sign in"
        to="/login"
      />
    </template>

    <UiOrganismsRegisterForm @success="handleSuccess" />
  </UiTemplatesAuthTemplate>
</template>
