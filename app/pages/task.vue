<script setup>
import { ref, onMounted } from "vue";

definePageMeta({
  layout: false,
  middleware: "auth",
});

const store = useWorkflowStore();

// Modal state
const formOpen = ref(false);
const editingStep = ref(null);

onMounted(() => {
  store.fetchWorkflows();
});

// Workflow actions
function onCreateWorkflow(data) {
  console.log("🚀 ~ onCreateWorkflow ~ data:", data);
  store.createWorkflow(data);
}

function onSelectWorkflow(workflow) {
  store.selectWorkflow(workflow);
}

function onDeleteWorkflow(workflowId) {
  store.deleteWorkflow(workflowId);
}

// Step actions
function openAddForm() {
  editingStep.value = null;
  formOpen.value = true;
}

function openEditForm(step) {
  editingStep.value = step;
  formOpen.value = true;
}

async function onSubmitStep(payload) {
  let ok;

  if (editingStep.value) {
    ok = await store.updateStep(editingStep.value?._id, payload);
  } else {
    ok = await store.addStep(payload);
  }

  if (ok) formOpen.value = false;
}

function onDeleteStep(stepId) {
  store.deleteStep(stepId);
}

function onReorderStep({ stepId, newSequence }) {
  store.reorderStep(stepId, newSequence);
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top bar -->
    <header
      class="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200"
    >
      <div
        class="max-w-7xl mx-auto flex items-center justify-between px-6 py-3"
      >
        <NuxtLink
          to="/chat"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Chat
        </NuxtLink>

        <span class="text-sm font-semibold text-gray-700"
          >Workflow Manager</span
        >
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-7xl mx-auto py-8 px-6">
      <div class="bg-white shadow-xl sm:rounded-xl border border-gray-100">
        <div class="flex min-h-[70vh]">
          <!-- Sidebar -->
          <aside class="w-64 border-r border-gray-200 p-4 shrink-0">
            <ModulesTaskWorkflowSelector
              :workflows="store.workflows"
              :active-id="store.activeWorkflow?._id"
              @select="onSelectWorkflow"
              @create="onCreateWorkflow"
              @delete="onDeleteWorkflow"
            />
          </aside>

          <!-- Main content -->
          <section class="flex-1 min-w-0 p-6">
            <template v-if="store.activeWorkflow">
              <!-- Header -->
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-xl font-bold text-gray-900">
                    {{ store.activeWorkflow.workflowName }}
                  </h2>
                  <p class="text-sm text-gray-400 mt-0.5">
                    {{ store.sortedSteps.length }} step{{
                      store.sortedSteps.length !== 1 ? "s" : ""
                    }}
                  </p>
                </div>
                <UiAtomsButton size="sm" @click="openAddForm">
                  + Add Step
                </UiAtomsButton>
              </div>

              <!-- Error alert -->
              <UiAtomsAlert
                v-if="store.error"
                :message="store.error"
                variant="error"
              />

              <!-- Loading -->
              <div v-if="store.isLoading" class="flex justify-center py-16">
                <svg
                  class="animate-spin h-8 w-8 text-indigo-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>

              <!-- Step table -->
              <ModulesTaskWorkflowStepList
                v-else
                :steps="store.sortedSteps"
                @edit="openEditForm"
                @delete="onDeleteStep"
                @reorder="onReorderStep"
              />
            </template>

            <!-- Empty state -->
            <div
              v-else
              class="flex flex-col items-center justify-center h-full text-gray-400"
            >
              <svg
                class="w-16 h-16 mb-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="text-sm">Select or create a workflow to get started</p>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- Step form modal -->
    <ModulesTaskWorkflowStepForm
      :is-open="formOpen"
      :step="editingStep"
      @submit="onSubmitStep"
      @close="formOpen = false"
    />
  </div>
</template>
