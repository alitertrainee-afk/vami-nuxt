/**
 * usePushNotifications
 * Phase 5 — Web Push subscription lifecycle.
 *
 * Usage: (in chat layout's onMounted)
 *   const { initPush, cleanup } = usePushNotifications()
 *   await initPush()
 */
import { ref } from "vue";
import { createChatService } from "~/components/modules/chat/services/chat.service.js";

export function usePushNotifications() {
  const isSupported = ref(false);
  const isSubscribed = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  let _subscription = null;

  function _getService() {
    const { apiFetch } = useApiFetch();
    return createChatService(apiFetch);
  }

  /**
   * Convert base64url VAPID public key to Uint8Array
   */
  function _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  /**
   * Initialize push notifications:
   * 1. Check for service worker + pushManager support
   * 2. Fetch VAPID public key from backend
   * 3. Subscribe to push
   * 4. Send subscription to backend
   */
  async function initPush() {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Not supported in this browser");
      isSupported.value = false;
      return;
    }

    isSupported.value = true;
    isLoading.value = true;
    error.value = null;

    try {
      // Register service worker if needed
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        _subscription = existing;
        isSubscribed.value = true;
        isLoading.value = false;
        return;
      }

      // Get VAPID key from backend
      const svc = _getService();
      const res = await svc.getVapidPublicKey();
      const vapidPublicKey = res.data?.publicKey;
      if (!vapidPublicKey) throw new Error("No VAPID public key returned");

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(vapidPublicKey),
      });
      _subscription = subscription;

      // Send to backend
      await svc.subscribePush(subscription.toJSON());
      isSubscribed.value = true;
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
      error.value = err?.message || "Push notification setup failed";
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Unsubscribe and remove from backend
   */
  async function cleanup() {
    if (!_subscription) return;
    try {
      const endpoint = _subscription.endpoint;
      await _subscription.unsubscribe();
      const svc = _getService();
      await svc.unsubscribePush(endpoint);
      isSubscribed.value = false;
      _subscription = null;
    } catch (err) {
      console.warn("[Push] Cleanup failed:", err);
    }
  }

  return { isSupported, isSubscribed, isLoading, error, initPush, cleanup };
}
