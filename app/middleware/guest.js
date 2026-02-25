import { useAuthStore } from "~/stores/auth.store.js";

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  if (authStore.isAuthenticated) {
    return navigateTo("/chat", { replace: true });
  }
});
