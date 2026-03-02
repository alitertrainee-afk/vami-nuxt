// libs imports
import { defineStore } from "pinia";
import { ref, computed } from "vue";

// services imports
import { createAuthService } from "~/services/auth.service.js";
import { createUserService } from "~/services/user.service.js";

// utils imports
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from "~/utils/localstorage.utils.js";

export const useAuthStore = defineStore("auth", () => {
  // state
  const user = ref(_hydrateUser());
  const token = ref(getLocalStorageItem("vami_token") || null);
  const isLoading = ref(false);
  const error = ref(null);

  // getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // helpers
  function _hydrateUser() {
    try {
      const raw = getLocalStorageItem("vami_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      removeLocalStorageItem("vami_user");
      return null;
    }
  }

  function _persistSession(userData, accessToken) {
    user.value = userData;
    token.value = accessToken;
    setLocalStorageItem("vami_token", accessToken);
    setLocalStorageItem("vami_user", JSON.stringify(userData));
  }

  function _clearSession() {
    user.value = null;
    token.value = null;
    error.value = null;
    removeLocalStorageItem("vami_token");
    removeLocalStorageItem("vami_user");
  }

  // actions
  async function login(credentials) {
    isLoading.value = true;
    error.value = null;

    try {
      const { apiFetch } = useApiFetch();
      const authService = createAuthService(apiFetch);
      const response = await authService.login(credentials);
      const { user: userData, token: accessToken } = response.data;

      _persistSession(userData, accessToken);
      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Login failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(userData) {
    isLoading.value = true;
    error.value = null;

    try {
      const { apiFetch } = useApiFetch();
      const authService = createAuthService(apiFetch);
      const response = await authService.register(userData);
      const { user: newUser, token: accessToken } = response.data;

      _persistSession(newUser, accessToken);
      return true;
    } catch (err) {
      error.value = err?.data?.message || err.message || "Registration failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Logout — clears local session and attempts server-side invalidation.
   */
  async function logout() {
    try {
      const { apiFetch } = useApiFetch();
      const authService = createAuthService(apiFetch);
      await authService.logout();
    } catch {
      // Proceed with local cleanup even if server call fails
    }
    _clearSession();
  }

  async function refreshAccessToken() {
    try {
      const { apiFetch } = useApiFetch();
      const authService = createAuthService(apiFetch);
      const response = await authService.refresh();
      const { user: newUser, token: newToken } = response.data;

      _persistSession(newUser, newToken);
      return newToken;
    } catch {
      await logout();
      return null;
    }
  }

  /**
   * Update the authenticated user's profile fields.
   */
  async function updateProfile(data) {
    isLoading.value = true;
    error.value = null;

    try {
      const { apiFetch } = useApiFetch();
      const userService = createUserService(apiFetch);
      const response = await userService.updateProfile(data);
      const updatedUser = response.data;

      user.value = updatedUser;
      setLocalStorageItem("vami_user", JSON.stringify(updatedUser));
      return true;
    } catch (err) {
      error.value =
        err?.data?.message || err.message || "Profile update failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Change the authenticated user's password.
   */
  async function changePassword(data) {
    isLoading.value = true;
    error.value = null;

    try {
      const { apiFetch } = useApiFetch();
      const userService = createUserService(apiFetch);
      await userService.changePassword(data);
      return true;
    } catch (err) {
      error.value =
        err?.data?.message || err.message || "Password change failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /** Clear the current error message. */
  function clearError() {
    error.value = null;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    // State
    user,
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    login,
    register,
    logout,
    refreshAccessToken,
    updateProfile,
    changePassword,
    clearError,
  };
});
