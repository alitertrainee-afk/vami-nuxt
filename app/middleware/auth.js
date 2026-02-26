import { useAuthStore } from "~/stores/auth.store.js";

/**
 * Auth Middleware — protects routes requiring authentication.
 *
 * Attempts a silent token refresh before redirecting to login,
 * so the user isn't unnecessarily logged out.
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    // Attempt silent token refresh before kicking user out
    const refreshed = await authStore.refreshAccessToken();
    if (!refreshed) {
      return navigateTo("/login", { replace: true });
    }
  }
});
