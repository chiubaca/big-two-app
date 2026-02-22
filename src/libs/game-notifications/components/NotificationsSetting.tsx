import clsx from "clsx";
import { useCheckBrowserNotificationsAPI } from "../hooks/useCheckBrowserNoticationsAPI";

export const NotificationSetting = () => {
  const {
    notificationStatus,
    disableBrowserNotifications,
    enableBrowserNotifications,
  } = useCheckBrowserNotificationsAPI();

  if (notificationStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="loading loading-dots loading-md text-casino-emeraldLight" />
      </div>
    );
  }

  return (
    <div className="bg-casino-black/30 rounded-xl p-4 border border-casino-emerald/10">
      <h4 className="text-casino-cream/70 text-sm uppercase tracking-wide mb-4">
        Notifications
      </h4>
      <p className="text-casino-cream/50 text-sm pb-4">
        Allow browser notifications to enable in-game alerts.
      </p>
      <div className="flex flex-col gap-3">
        <button
          className={clsx(
            "btn btn-sm transition-all",
            notificationStatus === "enabled"
              ? "bg-casino-emerald/30 text-casino-cream/70 border-casino-emerald/50 cursor-default"
              : "bg-casino-emerald text-casino-cream hover:bg-casino-emeraldLight hover:shadow-emerald border-none",
          )}
          aria-disabled={notificationStatus === "enabled" ? "false" : "true"}
          type="button"
          onClick={enableBrowserNotifications}
        >
          {notificationStatus === "enabled"
            ? "Browser notifications enabled"
            : "Enable browser notifications"}
        </button>
        <div className="flex items-center justify-center">
          <div className="h-px w-8 bg-casino-emerald/20" />
          <span className="text-casino-emerald/30 mx-2">↓</span>
          <div className="h-px w-8 bg-casino-emerald/20" />
        </div>
        <button
          className={clsx([
            "btn btn-sm transition-all",
            notificationStatus !== "enabled"
              ? "bg-casino-charcoal/50 text-casino-cream/30 border-casino-emerald/10 cursor-not-allowed"
              : "bg-casino-charcoal text-casino-cream border-casino-emerald/30 hover:bg-casino-charcoal/80 hover:border-casino-emerald/50",
          ])}
          aria-disabled={notificationStatus !== "enabled" ? "false" : "true"}
          type="button"
          onClick={() => console.log("enable game notificaitons")}
        >
          Enable in-game notifications
        </button>
      </div>
    </div>
  );
};
