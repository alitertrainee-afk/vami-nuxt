// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // SPA mode — preserves current localStorage/socket.io patterns
  ssr: false,

  // Pinia state management
  modules: ["@pinia/nuxt"],

  // Auto-import module composables & stores
  imports: {
    dirs: [
      "components/modules/chat/composables",
      "components/modules/chat/stores",
      "components/modules/task/stores",
    ],
  },

  // Global CSS
  css: ["~/assets/css/style.css"],

  // Enable page transitions
  app: {
    pageTransition: { name: "page", mode: "out-in" },
  },

  // Tailwind CSS v4 via Vite plugin
  vite: {
    plugins: [tailwindcss() as any],
  },

  // Runtime config (maps from .env NUXT_PUBLIC_* vars)
  runtimeConfig: {
    public: {
      apiBaseUrl: "http://localhost:5000/api/v1",
      socketUrl: "http://localhost:5000",
    },
  },
});
