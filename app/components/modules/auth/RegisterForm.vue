<script setup>
/**
 * RegisterForm Organism
 *
 * Client-side validation + auth store register action.
 * All components and composables are auto-imported by Nuxt.
 */
const emit = defineEmits(["success"]);

const authStore = useAuthStore();

const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const errors = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const validate = () => {
  let valid = true;
  errors.username = "";
  errors.email = "";
  errors.password = "";
  errors.confirmPassword = "";

  if (!form.username || form.username.length < 3) {
    errors.username = "Username must be at least 3 characters";
    valid = false;
  }

  if (!form.email) {
    errors.email = "Email is required";
    valid = false;
  }

  if (!form.password || form.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
    valid = false;
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
    valid = false;
  }

  return valid;
};

const submit = async () => {
  if (!validate()) return;

  const success = await authStore.register({
    username: form.username,
    email: form.email,
    password: form.password,
  });

  if (success) emit("success");
};
</script>

<template>
  <div>
    <UiAtomsAlert
      v-if="authStore.error"
      :message="authStore.error"
      variant="error"
    />

    <form @submit.prevent="submit" class="space-y-2">
      <UiAtomsInput
        v-model="form.username"
        label="Username"
        type="text"
        placeholder="johndoe"
        :error="errors.username"
        :disabled="authStore.isLoading"
        required
      />

      <UiAtomsInput
        v-model="form.email"
        label="Email address"
        type="email"
        placeholder="you@company.com"
        :error="errors.email"
        :disabled="authStore.isLoading"
        required
      />

      <UiAtomsInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="••••••••"
        :error="errors.password"
        :disabled="authStore.isLoading"
        required
      />

      <UiAtomsInput
        v-model="form.confirmPassword"
        label="Confirm password"
        type="password"
        placeholder="••••••••"
        :error="errors.confirmPassword"
        :disabled="authStore.isLoading"
        required
      />

      <UiAtomsButton type="submit" :loading="authStore.isLoading" fullWidth>
        Create account
      </UiAtomsButton>
    </form>
  </div>
</template>
