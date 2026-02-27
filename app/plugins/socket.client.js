import { socketClient } from "~/lib/socket.client.js";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      socket: socketClient,
    },
  };
});
