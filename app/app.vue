<script setup>
/**
 * Global SPA bootstrap.
 *
 * On every hard reload the access token is gone from memory (it was never
 * persisted to localStorage). If we have a cached user profile it means the
 * user was previously logged-in, so we silently hit /auth/refresh — the
 * httpOnly refresh cookie does the authentication. This restores the session
 * before the first route guard fires, preventing an unnecessary redirect to /login.
 */
const authStore = useAuthStore();

onMounted(async () => {
  if (!authStore.isAuthenticated && authStore.user) {
    await authStore.refreshAccessToken();
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Page transition for smooth navigation */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
