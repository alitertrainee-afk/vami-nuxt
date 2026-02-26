export function createAuthService(apiFetch) {
  return {
    login(credentials) {
      if (
        (!credentials.email && !credentials.username) ||
        !credentials.password
      ) {
        throw new Error("Email or username and password are required");
      }
      return apiFetch("/auth/login", { method: "POST", body: credentials });
    },

    register(userData) {
      return apiFetch("/auth/register", { method: "POST", body: userData });
    },

    refresh() {
      return apiFetch("/auth/refresh", { method: "POST" });
    },

    logout() {
      return apiFetch("/auth/logout", { method: "POST" });
    },
  };
}
