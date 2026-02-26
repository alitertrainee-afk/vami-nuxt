<script setup>
/**
 * ProfileForm Organism
 *
 * Two-section form: profile info + change password.
 * Re-uses UiAtomsAvatar, UiMoleculesFormField, UiAtomsButton, UiAtomsAlert.
 */
import { reactive, ref, watch } from "vue";

const authStore = useAuthStore();

// ── Profile section ──────────────────────────────────────────────────────────
const profile = reactive({
  username: "",
  email: "",
  bio: "",
  avatar: "",
  theme: "system",
  notifications: true,
});

// Seed form from store user
function seedProfile() {
  const u = authStore.user;
  if (!u) return;
  profile.username = u.username ?? "";
  profile.email = u.email ?? "";
  profile.bio = u.profile?.bio ?? "";
  profile.avatar = u.profile?.avatar ?? "";
  profile.theme = u.preferences?.theme ?? "system";
  profile.notifications = u.preferences?.notifications ?? true;
}
seedProfile();
watch(() => authStore.user, seedProfile, { deep: true });

const profileErrors = reactive({
  username: "",
  email: "",
  bio: "",
  avatar: "",
});

const profileSuccess = ref("");

function validateProfile() {
  let valid = true;
  profileErrors.username = "";
  profileErrors.email = "";
  profileErrors.bio = "";
  profileErrors.avatar = "";

  if (!profile.username || profile.username.length < 3) {
    profileErrors.username = "Username must be at least 3 characters";
    valid = false;
  }
  if (!profile.email) {
    profileErrors.email = "Email is required";
    valid = false;
  }
  if (profile.bio && profile.bio.length > 160) {
    profileErrors.bio = "Bio must be 160 characters or fewer";
    valid = false;
  }
  if (profile.avatar && !/^https?:\/\/.+/.test(profile.avatar)) {
    profileErrors.avatar = "Must be a valid URL";
    valid = false;
  }
  return valid;
}

async function submitProfile() {
  profileSuccess.value = "";
  authStore.clearError();
  if (!validateProfile()) return;

  const success = await authStore.updateProfile({
    username: profile.username,
    email: profile.email,
    bio: profile.bio,
    avatar: profile.avatar || null,
    theme: profile.theme,
    notifications: profile.notifications,
  });

  if (success) profileSuccess.value = "Profile updated successfully!";
}

// ── Password section ─────────────────────────────────────────────────────────
const password = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const passwordErrors = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const passwordSuccess = ref("");

function validatePassword() {
  let valid = true;
  passwordErrors.currentPassword = "";
  passwordErrors.newPassword = "";
  passwordErrors.confirmPassword = "";

  if (!password.currentPassword || password.currentPassword.length < 8) {
    passwordErrors.currentPassword = "Must be at least 8 characters";
    valid = false;
  }
  if (!password.newPassword || password.newPassword.length < 8) {
    passwordErrors.newPassword = "Must be at least 8 characters";
    valid = false;
  }
  if (password.newPassword !== password.confirmPassword) {
    passwordErrors.confirmPassword = "Passwords do not match";
    valid = false;
  }
  return valid;
}

async function submitPassword() {
  passwordSuccess.value = "";
  authStore.clearError();
  if (!validatePassword()) return;

  const success = await authStore.changePassword({
    currentPassword: password.currentPassword,
    newPassword: password.newPassword,
  });

  if (success) {
    passwordSuccess.value = "Password changed successfully!";
    password.currentPassword = "";
    password.newPassword = "";
    password.confirmPassword = "";
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- ───── Profile Info ───── -->
    <section>
      <h3 class="text-lg font-semibold text-gray-800 mb-4">
        Profile Information
      </h3>

      <UiAtomsAlert
        v-if="authStore.error"
        :message="authStore.error"
        variant="error"
      />
      <UiAtomsAlert
        v-if="profileSuccess"
        :message="profileSuccess"
        variant="success"
      />

      <form @submit.prevent="submitProfile" class="space-y-1">
        <!-- Avatar preview -->
        <div class="flex items-center gap-4 mb-4">
          <UiAtomsAvatar
            :src="profile.avatar || null"
            :name="profile.username || '?'"
            size="lg"
          />
          <div class="flex-1">
            <UiMoleculesFormField
              v-model="profile.avatar"
              label="Avatar URL"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              :error="profileErrors.avatar"
              :disabled="authStore.isLoading"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <UiMoleculesFormField
            v-model="profile.username"
            label="Username"
            placeholder="johndoe"
            :error="profileErrors.username"
            :disabled="authStore.isLoading"
            required
          />

          <UiMoleculesFormField
            v-model="profile.email"
            label="Email"
            type="email"
            placeholder="you@company.com"
            :error="profileErrors.email"
            :disabled="authStore.isLoading"
            required
          />
        </div>

        <!-- Bio (textarea) -->
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Bio
            <span class="font-normal text-gray-400"
              >({{ profile.bio.length }}/160)</span
            >
          </label>
          <textarea
            v-model="profile.bio"
            maxlength="160"
            rows="3"
            :disabled="authStore.isLoading"
            placeholder="Tell us about yourself…"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
          />
          <p
            v-if="profileErrors.bio"
            class="mt-1 text-sm text-red-600 animate-pulse"
          >
            {{ profileErrors.bio }}
          </p>
        </div>

        <!-- Preferences row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mb-4">
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-1"
              >Theme</label
            >
            <select
              v-model="profile.theme"
              :disabled="authStore.isLoading"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div class="mb-4 flex items-center gap-3 sm:mt-6">
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="profile.notifications"
                :disabled="authStore.isLoading"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
              ></div>
            </label>
            <span class="text-sm font-semibold text-gray-700"
              >Notifications</span
            >
          </div>
        </div>

        <UiAtomsButton type="submit" :loading="authStore.isLoading" fullWidth>
          Save Changes
        </UiAtomsButton>
      </form>
    </section>

    <!-- ───── Divider ───── -->
    <hr class="border-gray-200" />

    <!-- ───── Change Password ───── -->
    <section>
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>

      <UiAtomsAlert
        v-if="passwordSuccess"
        :message="passwordSuccess"
        variant="success"
      />

      <form @submit.prevent="submitPassword" class="space-y-1">
        <UiMoleculesFormField
          v-model="password.currentPassword"
          label="Current Password"
          type="password"
          placeholder="••••••••"
          :error="passwordErrors.currentPassword"
          :disabled="authStore.isLoading"
          required
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <UiMoleculesFormField
            v-model="password.newPassword"
            label="New Password"
            type="password"
            placeholder="••••••••"
            :error="passwordErrors.newPassword"
            :disabled="authStore.isLoading"
            required
          />

          <UiMoleculesFormField
            v-model="password.confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            :error="passwordErrors.confirmPassword"
            :disabled="authStore.isLoading"
            required
          />
        </div>

        <UiAtomsButton
          type="submit"
          :loading="authStore.isLoading"
          variant="secondary"
          fullWidth
        >
          Change Password
        </UiAtomsButton>
      </form>
    </section>
  </div>
</template>
