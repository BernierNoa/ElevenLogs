import { useEffect, useRef } from "react";
import { useUser } from "@clerk/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import {
  getPendingLogsForUser,
  PENDING_LOGS_RETRY_EVENT,
  recordPendingLogFailure,
  removePendingLog,
  STUCK_AFTER_ATTEMPTS,
  type PendingLog,
} from "../lib/pendingLogsDb";

// Aucun service worker : les deux déclencheurs demandés (retour réseau,
// retour au premier plan) s'observent directement depuis le code de l'app,
// sans rien en arrière-plan — et fonctionnent pareil sur tous les
// navigateurs, y compris iOS Safari qui ne supporte pas Background Sync.
export function OfflineSyncManager() {
  const supabase = useSupabaseClient();
  const { user, isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    async function syncOne(entry: PendingLog): Promise<boolean> {
      // Un autre appareil a peut-être déjà loggé ce match entre-temps pour
      // ce même compte. Filtre explicite sur user_id indispensable : la
      // policy RLS de lecture sur `logs` renvoie aussi les logs publics
      // d'AUTRES comptes à profil public — sans ce `.eq`, le log public de
      // quelqu'un d'autre sur ce match serait pris pour "déjà synchronisé"
      // et l'entrée en attente du compte courant serait jetée sans jamais
      // avoir été écrite.
      const { data: existing, error: selectError } = await supabase
        .from("logs")
        .select("id")
        .eq("match_id", entry.matchId)
        .eq("user_id", entry.userId)
        .maybeSingle();

      if (selectError) return false;

      if (existing) {
        await removePendingLog(entry.localId);
        return true;
      }

      const { error: insertError } = await supabase.from("logs").insert({
        user_id: entry.userId,
        match_id: entry.matchId,
        rating: entry.rating,
        motm_player_id: entry.motmPlayerId,
        comment: entry.comment,
        watched_at: entry.watchedAt,
      });

      if (insertError) return false;

      await removePendingLog(entry.localId);
      return true;
    }

    // `force` ignore le statut "bloqué" d'une entrée (relance manuelle
    // depuis PendingLogsIndicator) ; en temps normal (déclencheurs réseau /
    // premier plan) on ne retente pas automatiquement une entrée qui a déjà
    // échoué STUCK_AFTER_ATTEMPTS fois pour ne pas spammer le serveur avec
    // une requête qui a de bonnes chances d'échouer encore.
    async function sync(force: boolean) {
      if (isSyncing.current || !navigator.onLine) return;
      isSyncing.current = true;

      try {
        // Uniquement les entrées du compte courant : une entrée en attente
        // d'un autre compte déjà utilisé sur cet appareil serait de toute
        // façon rejetée par RLS (user_id ne correspondrait pas au JWT
        // courant), et ferait échouer/bloquer la synchro des entrées
        // suivantes qui appartiennent réellement à l'utilisateur courant.
        const pending = await getPendingLogsForUser(user!.id);
        let syncedAny = false;

        for (const entry of pending) {
          if (!navigator.onLine) break; // connexion perdue en cours de route, on réessaiera au prochain déclencheur

          if (!force && (entry.attemptCount ?? 0) >= STUCK_AFTER_ATTEMPTS) continue;

          const ok = await syncOne(entry);
          if (ok) {
            syncedAny = true;
          } else {
            // Échec qui n'est pas une simple coupure réseau (sinon on serait
            // déjà sorti à la vérification navigator.onLine ci-dessus) : on
            // compte la tentative mais on continue avec les entrées
            // suivantes plutôt que de bloquer toute la queue derrière celle-ci.
            await recordPendingLogFailure(entry.localId);
          }
        }

        if (syncedAny) {
          queryClient.invalidateQueries({ queryKey: ["my-logs", user!.id] });
        }
        queryClient.invalidateQueries({ queryKey: ["pending-logs-count", user!.id] });
      } finally {
        isSyncing.current = false;
      }
    }

    function handleOnline() {
      sync(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") sync(false);
    }

    function handleManualRetry() {
      sync(true);
    }

    sync(false);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(PENDING_LOGS_RETRY_EVENT, handleManualRetry);

    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(PENDING_LOGS_RETRY_EVENT, handleManualRetry);
    };
  }, [isSignedIn, user, supabase, queryClient]);

  return null;
}
