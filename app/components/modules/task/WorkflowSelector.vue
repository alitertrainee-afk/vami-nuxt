<script setup>
import { Icon } from "@iconify/vue";
import { ref } from "vue";

const props = defineProps({
  workflows: { type: Array, required: true },
  activeId: { type: String, default: null },
});

const emit = defineEmits(["select", "create", "delete"]);

const newName = ref("");
const showCreate = ref(false);

function handleCreate() {
  const name = newName.value.trim();
  console.log("🚀 ~ handleCreate ~ name:", name);
  if (!name) return;
  emit("create", { workflowName: name });

  // clear form after creating
  newName.value = "";
  showCreate.value = false;
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Workflows
      </h3>
      <UiAtomsButton
        size="sm"
        variant="ghost"
        @click="showCreate = !showCreate"
      >
        {{ showCreate ? "Cancel" : "+ New" }}
      </UiAtomsButton>
    </div>

    <!-- Create form -->
    <form v-if="showCreate" class="flex gap-2" @submit.prevent="handleCreate">
      <UiAtomsInput
        v-model="newName"
        placeholder="Workflow name…"
        no-margin
        class="flex-1"
      />
      <UiAtomsButton type="submit" size="sm" :disabled="!newName.trim()">
        Create
      </UiAtomsButton>
    </form>

    <!-- List -->
    <ul class="space-y-1">
      <li
        v-for="workflow in workflows"
        :key="workflow?._id"
        class="group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors"
        :class="
          workflow?._id === activeId
            ? 'bg-indigo-50 text-indigo-700'
            : 'hover:bg-gray-100 text-gray-700'
        "
        @click="emit('select', workflow)"
      >
        <span class="text-sm font-medium truncate">{{
          workflow?.workflowName
        }}</span>

        <UiAtomsTooltip text="Delete workflow" @click.stop>
          <UiAtomsButton
            icon-only
            variant="ghost"
            size="sm"
            aria-label="Delete workflow"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="emit('delete', workflow?._id)"
          >
            <Icon icon="tabler:trash" width="24" height="24" color="red" />
          </UiAtomsButton>
        </UiAtomsTooltip>
      </li>
    </ul>

    <p v-if="!workflows.length" class="text-sm text-gray-400 text-center py-4">
      No workflows yet
    </p>
  </div>
</template>
