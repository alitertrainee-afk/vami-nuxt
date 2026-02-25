<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>

<style>
/* Subtle page transition for enterprise feel */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
