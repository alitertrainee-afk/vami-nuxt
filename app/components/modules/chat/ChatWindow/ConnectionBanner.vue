<script setup>
const { isConnected, isReconnecting, connectionError } = useSocket();
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="-translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-full opacity-0"
  >
    <div
      v-if="!isConnected"
      class="flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-medium"
      :class="
        isReconnecting
          ? 'bg-yellow-50 text-yellow-700 border-b border-yellow-100'
          : 'bg-red-50 text-red-700 border-b border-red-100'
      "
    >
      <div
        v-if="isReconnecting"
        class="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"
      />
      <svg
        v-else
        class="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728"
        />
      </svg>
      <span>
        {{
          isReconnecting
            ? "Reconnecting..."
            : "Connection lost. Check your internet."
        }}
      </span>
    </div>
  </Transition>
</template>
