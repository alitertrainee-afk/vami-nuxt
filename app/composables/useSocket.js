import { ref } from "vue";
import { socketClient } from "~/lib/socket.client.js";

// Singleton reactive state
const isConnected = ref(false);
const isReconnecting = ref(false);
const connectionError = ref(null);

/**
 * useSocket — reactive wrapper around the socket.io singleton.
 *
 * Provides reactive connection state (`isConnected`, `isReconnecting`,
 * `connectionError`) and methods to connect/disconnect/emit.
 */
export function useSocket() {
  function connect(token) {
    socketClient.connect(token);

    if (socketClient.socket) {
      socketClient.socket.on("connect", () => {
        isConnected.value = true;
        isReconnecting.value = false;
        connectionError.value = null;
      });

      socketClient.socket.on("disconnect", (reason) => {
        isConnected.value = false;
        if (reason !== "io client disconnect") {
          isReconnecting.value = true;
        }
      });

      socketClient.socket.on("reconnect_attempt", (attempt) => {
        isReconnecting.value = true;
        connectionError.value = `Reconnecting... (attempt ${attempt})`;
      });

      socketClient.socket.on("reconnect", () => {
        isConnected.value = true;
        isReconnecting.value = false;
        connectionError.value = null;
      });

      socketClient.socket.on("reconnect_failed", () => {
        isReconnecting.value = false;
        connectionError.value = "Failed to reconnect. Please refresh.";
      });

      socketClient.socket.on("connect_error", (err) => {
        connectionError.value = err.message;
      });
    }
  }

  function disconnect() {
    socketClient.disconnect();
    isConnected.value = false;
    isReconnecting.value = false;
    connectionError.value = null;
  }

  function emit(event, data) {
    socketClient.emit(event, data);
  }

  function on(event, callback) {
    socketClient.on(event, callback);
  }

  function off(event) {
    socketClient.off(event);
  }

  return {
    isConnected,
    isReconnecting,
    connectionError,
    connect,
    disconnect,
    emit,
    on,
    off,
    // Expose raw client for edge cases
    client: socketClient,
  };
}
