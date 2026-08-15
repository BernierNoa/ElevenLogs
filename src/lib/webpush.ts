export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

function isBase64Url(s: string) {
  return /^[A-Za-z0-9_-]+$/.test(s);
}

// Convertit une clé VAPID base64url en Uint8Array (format attendu par PushManager)
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) {
    throw new Error('VAPID public key manquante (VITE_VAPID_PUBLIC_KEY)');
  }
  if (!isBase64Url(base64String)) {
    // On tente quand même.
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensureServiceWorkerRegistered() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers non supportés');
  }
  const registration = await navigator.serviceWorker.register('/sw.js');
  return registration;
}

export type WebPushSubscriptionLike = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function subscribeToWebPush(): Promise<WebPushSubscriptionLike> {
  if (!('PushManager' in window)) {
    throw new Error('Web Push non supporté');
  }
  const registration = await ensureServiceWorkerRegistered();

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission notifications refusée');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      VAPID_PUBLIC_KEY!,
    ) as any,
  });

  const json = subscription.toJSON() as unknown as WebPushSubscriptionLike;
  return json;
}
