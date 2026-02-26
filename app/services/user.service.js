export function createUserService(apiFetch) {
  return {
    searchUsers(query) {
      if (!query) return Promise.resolve({ data: [] });
      return apiFetch(`/users`, { params: { search: query } });
    },

    getProfile() {
      return apiFetch("/users/me");
    },

    updateProfile(data) {
      return apiFetch("/users/me", { method: "PATCH", body: data });
    },

    changePassword(data) {
      return apiFetch("/users/me/password", { method: "PATCH", body: data });
    },
  };
}
