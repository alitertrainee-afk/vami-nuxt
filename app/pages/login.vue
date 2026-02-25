<script setup>
definePageMeta({
  middleware: "guest",
});

const handleSuccess = () => {
  navigateTo("/chat");
};
</script>

<template>
  <UiTemplatesAuthTemplate title="Sign in to Vami">
    <template #subtitle>
      <UiMoleculesAuthFooterLink
        text="Or"
        linkText="create a new account"
        to="/register"
      />
    </template>

    <UiOrganismsLoginForm @success="handleSuccess" />
  </UiTemplatesAuthTemplate>
</template>
