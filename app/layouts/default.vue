<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top bar -->
    <header
      class="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200"
    >
      <div
        class="max-w-2xl mx-auto flex items-center justify-between px-4 py-3"
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

        <span class="text-sm font-semibold text-gray-700">Settings</span>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-2xl mx-auto py-8 px-4">
      <slot />
    </main>
  </div>
</template>
