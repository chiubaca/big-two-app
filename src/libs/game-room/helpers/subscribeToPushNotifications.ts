import { honoClient } from "~libs/hono-actions";

export async function subscribeToPushNotifications() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = (
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.PUBLIC_VAPID_KEY,
      })
    ).toJSON();

    // Send the subscription to your server
    await honoClient.api.enablePushSubscription.$post({
      json: {
        endpoint: subscription.endpoint || "",
        expirationTime: subscription.expirationTime || null,
        keys: {
          auth: subscription.keys?.auth || "",
          p256dh: subscription.keys?.p256dh || "",
        },
      },
    });

    return subscription;
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return null;
  }
}
