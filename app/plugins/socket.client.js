import { socketClient } from "~/components/modules/chat/lib/socket.client.js";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      socket: socketClient,
    },
  };
});
