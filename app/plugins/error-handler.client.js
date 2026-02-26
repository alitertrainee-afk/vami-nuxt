/**
 * Global Error Handler Plugin (client-only).
 *
 * Catches all unhandled Vue errors and Nuxt lifecycle errors.
 * Future: integrate with Sentry, LogRocket, or other monitoring services.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Catch all Vue component errors
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error("[GlobalError] Vue Error:", {
      error: error?.message || error,
      component: instance?.$options?.name || "Unknown",
      info,
    });
  };

  // Catch errors that propagate to the top level
  nuxtApp.hook("vue:error", (error, instance, info) => {
    console.error("[GlobalError] Propagated:", error);
  });

  // Handle app-level errors (plugin failures, etc.)
  nuxtApp.hook("app:error", (error) => {
    console.error("[GlobalError] App Error:", error);
  });
});
