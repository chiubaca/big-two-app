import clsx from "clsx";
import { useState, useEffect } from "react";
import { subscribeToPushNotifications } from "~libs/game-room/helpers/subscribeToPushNotifications";
import { useCheckBrowserNotificationsAPI } from "../hooks/useCheckBrowserNoticationsAPI";

export const NotificationSetting = () => {
  const {
    notificationStatus,
    disableBrowserNotifications,
    enableBrowserNotifications,
  } = useCheckBrowserNotificationsAPI();
  console.log(
    "🔍 ~  ~ src/libs/game-notifications/components/NotificationsSetting.tsx:6 ~ notificationStatus:",
    notificationStatus
  );

  if (notificationStatus === "loading") {
    return "loading...";
  }

  return (
    <fieldset className="fieldset w-xs rounded-box border border-base-300 bg-base-200 ">
      <legend className="fieldset-legend ml-3 text-lg">Notifications</legend>
      <div className="p-5">
        {/* biome-ignore lint/nursery/useSortedClasses: <explanation> */}
        <p className="text-red-500 pb-2">
          Allow browser notification for to enable in-game notifications.
        </p>
        <div className="flex flex-col flex-wrap items-center gap-1">
          <button
            className={clsx(
              "btn btn-sm",
              notificationStatus === "enabled" && "btn-disabled"
            )}
            aria-disabled={notificationStatus === "enabled" ? "false" : "true"}
            type="button"
            onClick={enableBrowserNotifications}
          >
            {notificationStatus === "enabled"
              ? "Browser notifications enabled 🙌🏼"
              : "Enable browser notifications"}
          </button>
          <span> ⬇︎ </span>
          <button
            className={clsx([
              "btn btn-sm",
              notificationStatus !== "enabled" && "btn-disabled",
            ])}
            aria-disabled={notificationStatus !== "enabled" ? "false" : "true"}
            type="button"
            onClick={() => console.log("enable game notificaitons")}
          >
            🔔 Enable in-games notifications
          </button>
        </div>
      </div>
    </fieldset>
  );
};
