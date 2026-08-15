import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSession, useUser } from "@clerk/react-router";
import { IconBell } from "./icons";
import { Button } from "./ui/Button";
import { useNotifications } from "../hooks/useNotifications";
import { useUnreadNotificationCount } from "../hooks/useUnreadNotificationCount";
import { useMarkNotificationsRead } from "../hooks/useMarkNotificationsRead";
import { formatRelativeTime } from "../lib/formatRelativeTime";
import { subscribeToWebPush } from "../lib/webpush";

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function NotificationBell() {
  const { isSignedIn } = useUser();
  const { session } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<"default" | "granted" | "denied" | null>(null);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [hasLocalSubscription, setHasLocalSubscription] = useState(false);
  const [pushEnableError, setPushEnableError] = useState<string | null>(null);

  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: notifications, isLoading, isError, refetch } = useNotifications(isOpen);
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const perm = Notification.permission as "default" | "granted" | "denied";
      setPushPermission(perm);
      setHasLocalSubscription(localStorage.getItem("webpush-subscribed") === "1");
    } catch {
      // no-op
    }
  }, []);

  if (!isSignedIn) return null;

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && unreadCount) markRead.mutate();
  }

  async function handleEnableIphonePush() {
    setIsEnablingPush(true);
    setPushEnableError(null);
    let step = "init";
    try {
      const accessToken = await session?.getToken();
      if (!accessToken) throw new Error("Session manquante");

      step = "subscribeToWebPush";
      const subscription = await subscribeToWebPush();

      step = "save-push-subscription";
      const res = await fetch(
        `${VITE_SUPABASE_URL}/functions/v1/save-push-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ subscription }),
        },
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }

      localStorage.setItem("webpush-subscribed", "1");
      setHasLocalSubscription(true);
      setPushPermission("granted");
    } catch (e: any) {
      const name = e?.name ? String(e.name) : null;
      const message = e?.message ? String(e.message) : null;
      setPushEnableError(
        `${step}: ${[name, message].filter(Boolean).join(": ") || String(e)}`,
      );
    } finally {
      setIsEnablingPush(false);
    }
  }

  const shouldShowEnable =
    pushPermission !== "granted" &&
    !hasLocalSubscription &&
    pushPermission !== "denied";

  return (
    <div className="relative">
      <button
        type="button"
        className="relative w-9 h-9 grid place-items-center rounded-md hover:bg-nuit-haute transition-colors"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <IconBell className="w-[19px] h-[19px] text-craie" />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-[3px] rounded-full bg-projecteur text-noir font-data text-[9px] font-bold grid place-items-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-[320px] carte p-1.5 max-h-[420px] overflow-y-auto z-40">
            {shouldShowEnable && (
              <div className="px-2.5 py-2 mb-2 border-b border-ligne">
                <p className="text-gris-fonce text-[12px] mb-2">
                  Active des notifications iPhone (toast système).
                </p>
                <Button
                  variant="secondaire"
                  size="sm"
                  onClick={handleEnableIphonePush}
                  disabled={isEnablingPush}
                >
                  {isEnablingPush ? "Activation…" : "Activer"}
                </Button>
                {pushEnableError && (
                  <p className="text-gris-fonce text-[11.5px] mt-2">
                    {pushEnableError}
                  </p>
                )}
              </div>
            )}

            {isLoading && (
              <p className="text-gris-fonce text-[12px] px-2.5 py-2">Chargement…</p>
            )}
            {isError && (
              <div className="px-2.5 py-2">
                <p className="text-gris-fonce text-[12px] mb-2">
                  Impossible de charger tes notifications.
                </p>
                <Button variant="discret" size="sm" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            )}
            {!isLoading && !isError && (notifications?.length ?? 0) === 0 && (
              <p className="text-gris-fonce text-[12px] px-2.5 py-2">
                Aucune notification pour l'instant.
              </p>
            )}
            {!isError &&
              notifications?.map((n) => (
                <Link
                  key={n.id}
                  to={n.type === "follow" ? `/u/${n.actorId}` : "/journal"}
                  onClick={() => setIsOpen(false)}
                  className={[
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-nuit-haute transition-colors",
                    !n.readAt ? "bg-nuit-haute/50" : "",
                  ].join(" ")}
                >
                  {n.actorAvatarUrl ? (
                    <img
                      src={n.actorAvatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-nuit-haute shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-snug">
                      <span className="font-semibold">{n.actorDisplayName}</span>{" "}
                      {n.type === "follow"
                        ? "a commencé à te suivre"
                        : `a aimé ton log${n.matchLabel ? ` sur ${n.matchLabel}` : ""}`}
                    </p>
                    <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em]">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
