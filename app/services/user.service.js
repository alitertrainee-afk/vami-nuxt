export function createUserService(apiFetch) {
  return {
    searchUsers(query) {
      if (!query) return Promise.resolve({ data: [] });
      return apiFetch(`/users`, { params: { search: query } });
    },
  };
}
