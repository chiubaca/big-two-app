import { useState, useEffect } from "react";
import { subscribeToPushNotifications } from "~libs/game-room/helpers/subscribeToPushNotifications";

export const NotificationSetting = () => {
  // TODO seperate settings for enabling browser and push notifications

  const [notificationStatus, setNotificationStatus] = useState<
    "not-supported" | "not-enabled" | "enabled" | "loading"
  >("loading"); // Start with "loading" while determining the initial state

  console.log(
    "🚀 ~ ToggleNotificationsButton ~ notificationStatus:",
    notificationStatus
  );

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

  const enableNotifications = async () => {
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

  const disableNotifications = () => {
    // TODO, this doesnt do anything right now, we need to block on the backend when this is pressed
    setNotificationStatus("not-enabled");
  };

  if (notificationStatus === "loading") {
    return <p>⚠️ Please allow browser notifications...</p>;
  }

  return (
    <>
      {notificationStatus === "enabled" ? (
        <p className="text-green-500">
          Browser notifications have been enabled for this game
          <button
            className="btn btn-sm"
            type="button"
            onClick={disableNotifications}
          >
            🔕 Disable notifications
          </button>
        </p>
      ) : (
        <p className="text-red-500">
          Browser notifications have been disabled for this game,{" "}
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => enableNotifications()}
          >
            🔔 Enable notification
          </button>
        </p>
      )}
    </>
  );
};
