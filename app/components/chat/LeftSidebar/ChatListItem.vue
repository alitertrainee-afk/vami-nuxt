<script setup>
import { ArrowDown01Icon } from "hugeicons-vue";
import BaseListItem from "../../ui/molecules/BaseListItem.vue";
import Avatar from "../../ui/atoms/Avatar.vue";
import DropdownMenu from "../../ui/molecules/DropdownMenu.vue";
import { useChatItemDetails } from "~/composables/useChatItemDetails.js";
import { CHAT_CONTEXT_ACTIONS } from "~/components/chat/LeftSidebar/config/chat-context.config.js";

const props = defineProps({
  chat: { type: Object, required: true },
  isActive: { type: Boolean, default: false },
});

const emit = defineEmits(["click", "contextAction"]);

const { details, formattedTime, leftIndicators, rightBadges } =
  useChatItemDetails(() => props.chat);

const handleAction = (action) => {
  emit("contextAction", { action, chat: props.chat });
};
</script>

<template>
  <BaseListItem
    :title="details.name"
    :showBorder="false"
    titleClass="text-sm font-semibold text-gray-900"
    :hoverBgClass="isActive ? '' : 'hover:bg-gray-100'"
    :class="[
      'group transition-colors duration-150',
      isActive ? 'bg-gray-100' : 'border-transparent',
    ]"
    @click="emit('click', chat)"
  >
    <template #leading>
      <Avatar
        :src="details.avatar"
        :name="details.name"
        :is-online="details.isOnline"
        size="md"
      />
    </template>

    <template #trailing>
      <span
        :class="[
          'text-xs whitespace-nowrap transition-colors',
          chat?.unreadCount > 0
            ? 'text-green-500 font-semibold'
            : 'text-gray-400',
        ]"
      >
        {{ formattedTime }}
      </span>
    </template>

    <template #subtitle>
      <div class="flex justify-between items-center mt-0.5 w-full">
        <div class="flex items-center gap-1 min-w-0 flex-1 mr-2">
          <span
            v-if="chat?.isTyping"
            class="text-sm text-green-500 font-medium tracking-wide"
            >typing...</span
          >
          <template v-else>
            <div v-for="ind in leftIndicators" :key="ind.id" class="shrink-0">
              <component
                v-if="ind.isIcon"
                :is="ind.component"
                :size="16"
                :class="ind.class"
              />
              <span v-else :class="ind.class">{{ ind.text }}</span>
            </div>
            <span
              class="text-sm text-gray-500 truncate transition-all duration-300"
            >
              {{ chat.latestMessage?.content || "Started a conversation" }}
            </span>
          </template>
        </div>

        <div class="flex items-center shrink-0 gap-1.5 h-5">
          <div v-for="badge in rightBadges" :key="badge.id" class="shrink-0">
            <component
              v-if="badge.isIcon"
              :is="badge.component"
              :size="16"
              :class="badge.class"
            />
            <div v-else :class="badge.class">{{ badge.text }}</div>
          </div>

          <DropdownMenu
            :items="CHAT_CONTEXT_ACTIONS"
            position="bottom-right"
            @select="handleAction"
          >
            <template #trigger="{ isOpen }">
              <div
                :class="[
                  'flex items-center justify-end overflow-hidden transition-all duration-300 ease-in-out shrink-0 translate-x-2',
                  isOpen
                    ? 'w-5 opacity-100 ml-1 translate-x-0'
                    : 'w-0 opacity-0 ml-0 group-hover:w-5 group-hover:opacity-100 group-hover:ml-1 group-hover:translate-x-0',
                ]"
              >
                <ArrowDown01Icon
                  :size="20"
                  class="text-gray-400 min-w-[20px] hover:text-gray-600 transition-colors"
                />
              </div>
            </template>
          </DropdownMenu>
        </div>
      </div>
    </template>
  </BaseListItem>
</template>
