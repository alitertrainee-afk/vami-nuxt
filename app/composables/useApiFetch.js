const AUTH_ENDPOINTS = /^\/auth\/(login|register|refresh|logout)$/i;

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
      if (
        error?.response?.status === 401 &&
        !options._retry &&
        !AUTH_ENDPOINTS.test(url)
      ) {
        const refreshed = await authStore.refreshAccessToken();
        if (refreshed) {
          return apiFetch(url, {
            ...options,
            _retry: true,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${authStore.token}`,
            },
          });
        } else {
          navigateTo("/login", { replace: true });
        }
      }
      throw error;
    }
  }

  return { apiFetch };
}
