/**
 * Socket.io Client Plugin (client-only).
 *
 * Provides the socket client singleton as `$socket` via Nuxt's provide system.
 * Components can access it via `useNuxtApp().$socket`.
 */
import { socketClient } from "~/lib/socket.client.js";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      socket: socketClient,
    },
  };
});
