import {
  Archive02Icon,
  NotificationOff02Icon,
  PinLocation02Icon,
  TickDouble02Icon,
  UserBlock01Icon,
  Delete02Icon,
} from "hugeicons-vue";

export const CHAT_CONTEXT_ACTIONS = [
  { label: "Archive chat", icon: Archive02Icon, action: "archive" },
  { label: "Mute notifications", icon: NotificationOff02Icon, action: "mute" },
  { separator: true },
  { label: "Pin chat", icon: PinLocation02Icon, action: "pin" },
  { label: "Mark as unread", icon: TickDouble02Icon, action: "mark_unread" },
  { separator: true },
  { label: "Block", icon: UserBlock01Icon, action: "block", danger: true },
  { label: "Delete chat", icon: Delete02Icon, action: "delete", danger: true },
];
