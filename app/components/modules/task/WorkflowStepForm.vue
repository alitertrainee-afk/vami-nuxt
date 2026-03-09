<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  step: { type: Object, default: null },
  isOpen: { type: Boolean, default: false },
});

const emit = defineEmits(["submit", "close"]);

const isEdit = ref(false);
const title = ref("");
const description = ref("");
const status = ref("active");

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return;

    if (props.step) {
      isEdit.value = true;
      title.value = props.step.title;
      description.value = props.step.description || "";
      status.value = props.step.status || "active";
    } else {
      isEdit.value = false;
      title.value = "";
      description.value = "";
      status.value = "active";
    }
  },
  { immediate: true },
);

function handleSubmit() {
  if (!title.value.trim()) return;

  const payload = {
    title: title.value.trim(),
    description: description.value.trim(),
  };

  if (isEdit.value) payload.status = status.value;

  emit("submit", payload);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-[slideUp_0.2s_ease-out]"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-5">
            {{ isEdit ? "Edit Step" : "Add Step" }}
          </h3>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <UiAtomsInput
              v-model="title"
              label="Title"
              placeholder="Step title…"
              required
              no-margin
            />

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                v-model="description"
                rows="3"
                placeholder="Step description…"
                class="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>

            <div v-if="isEdit">
              <label class="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                v-model="status"
                class="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <UiAtomsButton variant="secondary" @click="emit('close')">
                Cancel
              </UiAtomsButton>
              <UiAtomsButton type="submit" :disabled="!title.trim()">
                {{ isEdit ? "Save Changes" : "Add Step" }}
              </UiAtomsButton>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
