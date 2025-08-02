import { useEffect, useState } from "react";
import { subscribeToPushNotifications } from "~libs/game-room/helpers/subscribeToPushNotifications";

export const useCheckBrowserNotificationsAPI = () => {
  const [notificationStatus, setNotificationStatus] = useState<
    "not-supported" | "not-enabled" | "enabled" | "loading"
  >("loading"); // Start with "loading" while determining the initial state

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!("Notification" in window)) {
        setNotificationStatus("not-supported");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationStatus("enabled");
      } else {
        setNotificationStatus("not-enabled");
      }
    };

    checkNotificationStatus();
  }, []);

  const enableBrowserNotifications = async () => {
    try {
      setNotificationStatus("loading");

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        setNotificationStatus("not-enabled");
        return;
      }

      // Subscribe to push notifications
      await subscribeToPushNotifications();
      setNotificationStatus("enabled");
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setNotificationStatus("not-enabled");
    }
  };

  const disableBrowserNotifications = () => {
    // TODO, this doesnt do anything right now, we need to block on the backend when this is pressed
    setNotificationStatus("not-enabled");
  };

  return {
    notificationStatus,
    enableBrowserNotifications,
    disableBrowserNotifications,
  };
};
