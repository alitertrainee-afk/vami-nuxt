export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error("[GlobalError] Vue Error:", {
      error: error?.message || error,
      component: instance?.$options?.name || "Unknown",
      info,
    });
  };

  nuxtApp.hook("vue:error", (error, instance, info) => {
    console.error("[GlobalError] Propagated:", error);
  });

  nuxtApp.hook("app:error", (error) => {
    console.error("[GlobalError] App Error:", error);
  });
});
