import { openDB, type DBSchema } from "idb";

// Nombre d'échecs consécutifs (hors coupures réseau, déjà filtrées avant
// d'appeler recordPendingLogFailure) au-delà duquel une entrée est considérée
// "bloquée" : elle n'est plus retentée automatiquement et attend une relance
// manuelle depuis PendingLogsIndicator.
export const STUCK_AFTER_ATTEMPTS = 3;

// Event DOM déclenché par PendingLogsIndicator (bouton "Réessayer") et écouté
// par OfflineSyncManager pour forcer une resynchro, y compris des entrées
// bloquées.
export const PENDING_LOGS_RETRY_EVENT = "pending-logs-retry";

export interface PendingLog {
  localId: string;
  userId: string;
  matchId: string;
  rating: number;
  motmPlayerId: string | null;
  comment: string | null;
  watchedAt: string;
  createdAt: string;
  // Optionnels : absents sur les entrées déjà en base avant l'ajout de ce
  // suivi (pas de migration de schéma pour ça), donc toujours lus avec un
  // fallback (`?? 0`, `?? null`) plutôt que supposés présents.
  attemptCount?: number;
  lastErrorAt?: string | null;
}

interface OfflineDB extends DBSchema {
  pending_logs: {
    key: string;
    value: PendingLog;
  };
}

const dbPromise = openDB<OfflineDB>("eleven-logs-offline", 1, {
  upgrade(db) {
    db.createObjectStore("pending_logs", { keyPath: "localId" });
  },
});

// Upsert local sur (userId, matchId) : re-noter un match déjà en attente de
// synchro remplace l'entrée existante au lieu d'en empiler une seconde.
// Sans ça, la 1ère entrée se synchronise, puis OfflineSyncManager prend le
// log fraîchement inséré pour "déjà synchronisé" côté 2ème entrée et la
// jette sans jamais écrire sa correction — perte silencieuse.
export async function addPendingLog(
  entry: Omit<PendingLog, "localId" | "createdAt" | "attemptCount" | "lastErrorAt">,
): Promise<PendingLog> {
  const db = await dbPromise;
  const all = await db.getAll("pending_logs");
  const existing = all.find(
    (p) => p.userId === entry.userId && p.matchId === entry.matchId,
  );

  const pending: PendingLog = {
    ...entry,
    localId: existing?.localId ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    lastErrorAt: null,
  };
  await db.put("pending_logs", pending);
  return pending;
}

export async function getAllPendingLogs(): Promise<PendingLog[]> {
  const db = await dbPromise;
  return db.getAll("pending_logs");
}

// L'IndexedDB est partagée par tout le navigateur, pas par compte Clerk :
// une entrée en attente d'un autre compte (déjà utilisé sur cet appareil)
// peut rester dans le même store. Filtrer par userId évite de la compter
// dans le badge d'un autre utilisateur, ou de tenter de la synchroniser
// sous une session qui n'est pas la sienne (RLS la rejetterait de toute
// façon, mais elle bloquerait alors la synchro des entrées suivantes).
export async function getPendingLogsForUser(userId: string): Promise<PendingLog[]> {
  const all = await getAllPendingLogs();
  return all.filter((entry) => entry.userId === userId);
}

export async function removePendingLog(localId: string): Promise<void> {
  const db = await dbPromise;
  await db.delete("pending_logs", localId);
}

// Incrémente le compteur d'échecs d'une entrée après une tentative de
// synchro infructueuse. N'a aucun effet si l'entrée a déjà été retirée entre
// temps (ex. synchronisée par un autre appareil pendant qu'on itérait).
export async function recordPendingLogFailure(localId: string): Promise<void> {
  const db = await dbPromise;
  const entry = await db.get("pending_logs", localId);
  if (!entry) return;

  await db.put("pending_logs", {
    ...entry,
    attemptCount: (entry.attemptCount ?? 0) + 1,
    lastErrorAt: new Date().toISOString(),
  });
}
