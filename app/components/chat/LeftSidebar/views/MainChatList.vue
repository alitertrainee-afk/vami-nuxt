<script setup>
// Icons
import { BubbleChatAddIcon, MoreVerticalSquare01Icon } from "hugeicons-vue";

// Components
import PanelLayout from "../../layout/PanelLayout.vue";
import UserSearch from "../UserSearch.vue";
import FilterChip from "../FilterChip.vue";
import NewChatPanel from "./NewChatPanel.vue";
import SidebarBody from "../SidebarBody.vue";

// UI Imports - [Molecules]
import DropdownMenu from "../../../ui/molecules/DropdownMenu.vue";

// UI Imports - [Atoms]
import Button from "../../../ui/atoms/Button.vue";
import Tooltip from "../../../ui/atoms/Tooltip.vue";

// Config
import { MAIN_MENU_ACTIONS } from "~/components/chat/LeftSidebar/config/sidebar.config.js";

const chatStore = useChatStore();
const authStore = useAuthStore();
const { openPanel } = usePanelManager();

// Handlers
const handleMenuSelect = (action) => {
  if (action === "logout") {
    authStore?.logout();
    return navigateTo("/login");
  }
};

const handleNewChatClick = () => openPanel("left", NewChatPanel);

const handleUserClick = async (user) => {
  try {
    await chatStore.setActiveChatFromUser(user._id);
    chatStore.handleSearch("");
  } catch (error) {
    console.error("Failed to start chat from search:", error);
  }
};

const handleChatContextAction = ({ action, chat }) => {
  console.log(`Action: ${action} triggered for chat:`, chat?._id);
};
</script>

<template>
  <PanelLayout
    title="Chats"
    :showBackButton="false"
    headerTextClass="text-gray-800"
    mainBgClass="bg-white"
  >
    <template #header-actions>
      <div class="flex gap-1 text-gray-600">
        <Tooltip text="New Chat Ctrl+Alt+N" position="bottom">
          <Button
            variant="ghost"
            :iconOnly="true"
            @click="handleNewChatClick"
            title="New Chat"
          >
            <BubbleChatAddIcon :size="22" />
          </Button>
        </Tooltip>
        <DropdownMenu
          :items="MAIN_MENU_ACTIONS"
          position="bottom-right"
          @select="handleMenuSelect"
        >
          <template #trigger>
            <Tooltip text="Menu" position="bottom">
              <Button variant="ghost" :iconOnly="true">
                <MoreVerticalSquare01Icon :size="22" />
              </Button>
            </Tooltip>
          </template>
        </DropdownMenu>
      </div>
    </template>

    <template #subheader>
      <UserSearch />
      <FilterChip v-show="!chatStore.searchQuery" />
    </template>

    <SidebarBody
      :isLoadingChats="chatStore.isLoadingChats"
      :filteredConversations="chatStore.filteredConversations"
      :searchQuery="chatStore.searchQuery"
      :searchResults="chatStore.searchResults"
      :activeChatId="chatStore.activeChat?._id"
      :onChatSelect="chatStore.setActiveChat"
      :onChatContextAction="handleChatContextAction"
      :onUserClick="handleUserClick"
      :onNewChat="handleNewChatClick"
    />
  </PanelLayout>
</template>
