<script setup>
import { ref } from "vue";

defineProps({
  steps: { type: Array, required: true },
});

const emit = defineEmits(["edit", "delete", "reorder"]);

// Inline reorder state
const reorderingId = ref(null);
const reorderValue = ref(1);

function startReorder(step) {
  console.log("🚀 ~ startReorder ~ step:", step);
  reorderingId.value = step?._id;
  reorderValue.value = step?.sequence;
}

function confirmReorder(stepId) {
  emit("reorder", { stepId, newSequence: reorderValue.value });
  reorderingId.value = null;
}

function cancelReorder() {
  reorderingId.value = null;
}
</script>

<template>
  <p v-if="!steps.length" class="text-center text-gray-400 py-10 text-sm">
    No steps yet — add one to get started
  </p>
  <div v-else class="overflow-x-auto h-100">
    <table class="w-full text-sm table-auto">
      <thead>
        <tr class="border-b border-gray-200">
          <th
            class="text-left py-3 px-4 font-semibold text-gray-500 uppercase tracking-wider text-xs w-16"
          >
            #
          </th>
          <th
            class="text-left py-3 px-4 font-semibold text-gray-500 uppercase tracking-wider text-xs"
          >
            Title
          </th>
          <th
            class="text-left py-3 px-4 font-semibold text-gray-500 uppercase tracking-wider text-xs hidden sm:table-cell"
          >
            Description
          </th>
          <th
            class="text-left py-3 px-4 font-semibold text-gray-500 uppercase tracking-wider text-xs w-24"
          >
            Status
          </th>
          <th
            class="text-right py-3 px-4 font-semibold text-gray-500 uppercase tracking-wider text-xs w-40"
          >
            Actions
          </th>
        </tr>
      </thead>

      <tbody class="overflow-y-auto h-100">
        <tr
          v-for="step in steps"
          :key="step?._id"
          class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <!-- Sequence -->
          <td class="py-3 px-4">
            <template v-if="reorderingId === step._id">
              <div class="flex items-center gap-1">
                <UiAtomsInput
                  v-model.number="reorderValue"
                  type="number"
                  min="1"
                  :max="steps.length"
                  class="w-12 border border-indigo-300 rounded px-1 py-0.5 text-center text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  @keyup.enter="confirmReorder(step._id)"
                  @keyup.escape="cancelReorder"
                />
                <UiAtomsButton
                  icon-only
                  variant="ghost"
                  size="sm"
                  aria-label="Confirm reorder"
                  @click="confirmReorder(step._id)"
                >
                  <svg
                    class="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </UiAtomsButton>
                <UiAtomsButton
                  icon-only
                  variant="ghost"
                  size="sm"
                  aria-label="Cancel reorder"
                  @click="cancelReorder"
                >
                  <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </UiAtomsButton>
              </div>
            </template>
            <template v-else>
              <span
                class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs"
              >
                {{ step.sequence }}
              </span>
            </template>
          </td>

          <!-- Title -->
          <td class="py-3 px-4 font-medium text-gray-900">
            {{ step.title }}
          </td>

          <!-- Description -->
          <td class="py-3 px-4 text-gray-500 hidden sm:table-cell">
            {{ step.description || "—" }}
          </td>

          <!-- Status -->
          <td class="py-3 px-4">
            <span
              class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
              :class="
                step.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ step.status }}
            </span>
          </td>

          <!-- Actions -->
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1">
              <!-- Reorder -->
              <UiAtomsTooltip text="Reorder">
                <UiAtomsButton
                  icon-only
                  variant="ghost"
                  size="sm"
                  aria-label="Reorder step"
                  @click="startReorder(step)"
                >
                  <svg
                    class="w-4 h-4 text-gray-400 hover:text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </UiAtomsButton>
              </UiAtomsTooltip>

              <!-- Edit -->
              <UiAtomsTooltip text="Edit">
                <UiAtomsButton
                  icon-only
                  variant="ghost"
                  size="sm"
                  aria-label="Edit step"
                  @click="emit('edit', step)"
                >
                  <svg
                    class="w-4 h-4 text-gray-400 hover:text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </UiAtomsButton>
              </UiAtomsTooltip>

              <!-- Delete -->
              <UiAtomsTooltip text="Delete">
                <UiAtomsButton
                  icon-only
                  variant="danger"
                  size="sm"
                  aria-label="Delete step"
                  @click="emit('delete', step._id)"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </UiAtomsButton>
              </UiAtomsTooltip>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
