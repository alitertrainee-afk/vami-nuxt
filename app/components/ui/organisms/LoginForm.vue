<script setup>
/**
 * LoginForm Organism
 *
 * Client-side validation + auth store login action.
 * Uses Nuxt auto-imported components (UiAtomsButton, etc.)
 * and auto-imported store (useAuthStore).
 */
const emit = defineEmits(["success"]);

const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

const errors = reactive({
  email: "",
  password: "",
});

const validate = () => {
  let valid = true;
  errors.email = "";
  errors.password = "";

  if (!form.email) {
    errors.email = "Email is required";
    valid = false;
  }

  if (!form.password) {
    errors.password = "Password is required";
    valid = false;
  }

  return valid;
};

const submit = async () => {
  if (!validate()) return;

  const success = await authStore.login(form);
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
      <UiMoleculesFormField
        v-model="form.email"
        label="Email address"
        type="email"
        placeholder="you@company.com"
        :error="errors.email"
        :disabled="authStore.isLoading"
        required
      />

      <UiMoleculesFormField
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="••••••••"
        :error="errors.password"
        :disabled="authStore.isLoading"
        required
      />

      <UiAtomsButton type="submit" :loading="authStore.isLoading" fullWidth>
        Sign in
      </UiAtomsButton>
    </form>
  </div>
</template>
