export function useApiFetch() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  async function apiFetch(url, options = {}) {
    const headers = { ...options.headers };

    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`;
    }

    try {
      return await $fetch(url, {
        baseURL: config.public.apiBaseUrl || "http://localhost:5000/api",
        credentials: "include",
        headers,
        ...options,
      });
    } catch (error) {
      // Handle 401 — attempt silent token refresh
      if (error?.response?.status === 401 && !options._retry) {
        const refreshed = await authStore.refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          return apiFetch(url, {
            ...options,
            _retry: true,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${authStore.token}`,
            },
          });
        } else {
          // Refresh failed — redirect to login
          navigateTo("/login", { replace: true });
        }
      }
      throw error;
    }
  }

  return { apiFetch };
}
