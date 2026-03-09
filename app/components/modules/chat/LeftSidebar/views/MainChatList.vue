<script setup>
// Icons
import { BubbleChatAddIcon, MoreVerticalSquare01Icon, EyeIcon } from "hugeicons-vue";

// Components
import PanelLayout from "../../layout/PanelLayout.vue";
import UserSearch from "../UserSearch.vue";
import FilterChip from "../FilterChip.vue";
import NewChatPanel from "./NewChatPanel.vue";
import StatusFeedPanel from "./StatusFeedPanel.vue";
import SidebarBody from "../SidebarBody.vue";

// UI Imports - [Molecules]
import DropdownMenu from "../../../../ui/molecules/DropdownMenu.vue";

// UI Imports - [Atoms]
import Button from "../../../../ui/atoms/Button.vue";
import Tooltip from "../../../../ui/atoms/Tooltip.vue";

// Config
import { MAIN_MENU_ACTIONS } from "~/components/modules/chat/LeftSidebar/config/sidebar.config.js";

const chatStore = useChatStore();
const authStore = useAuthStore();
const { openPanel } = usePanelManager();

// Handlers
const handleMenuSelect = async (action) => {
  if (action === "logout") {
    await authStore?.logout();
    return navigateTo("/login");
  }
};

const handleNewChatClick = () => openPanel("left", NewChatPanel);
const handleStatusClick = () => openPanel("left", StatusFeedPanel);

const handleUserClick = async (user) => {
  try {
    await chatStore.setActiveChatFromUser(user._id);
    chatStore.handleSearch("");
  } catch (error) {
    console.error("Failed to start chat from search:", error);
  }
};

const handleChatContextAction = async ({ action, chat }) => {
  if (!chat?._id) return;
  try {
    switch (action) {
      case "pin":
        await chatStore.updateConversationSetting(chat._id, { isPinned: true });
        break;
      case "unpin":
        await chatStore.updateConversationSetting(chat._id, { isPinned: false });
        break;
      case "mute":
        await chatStore.updateConversationSetting(chat._id, { isMuted: true });
        break;
      case "unmute":
        await chatStore.updateConversationSetting(chat._id, { isMuted: false });
        break;
      case "archive":
        await chatStore.updateConversationSetting(chat._id, { isArchived: true });
        break;
      case "unarchive":
        await chatStore.updateConversationSetting(chat._id, { isArchived: false });
        break;
      case "leave":
        await chatStore.leaveGroup(chat._id);
        break;
      default:
        console.warn("[MainChatList] Unknown context action:", action);
    }
  } catch (err) {
    console.error("[MainChatList] Context action failed:", action, err);
  }
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
        <Tooltip text="Status Updates" position="bottom">
          <Button
            variant="ghost"
            :iconOnly="true"
            @click="handleStatusClick"
            title="Status"
          >
            <EyeIcon :size="22" />
          </Button>
        </Tooltip>
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
