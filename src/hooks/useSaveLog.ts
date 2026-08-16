import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { showCelebrateToast, showToast } from "../lib/toastStore";
import { addPendingLog } from "../lib/pendingLogsDb";
import type { LogItem } from "./useMyLogs";

export interface SaveLogInput {
  matchId: string;
  rating: number;
  motmPlayerId: string | null;
  comment: string | null;
  watchedAt: string;
}

interface SaveLogResult {
  queued: boolean;
}

interface MutationContext {
  previous?: Map<string, LogItem>;
}

// Upsert sur (user_id, match_id) : re-noter un match déjà loggé met à jour la
// ligne existante plutôt que d'en créer une seconde (contrainte unique côté DB).
export function useSaveLog() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const myLogsKey = ["my-logs", user?.id] as const;

  return useMutation<SaveLogResult, Error, SaveLogInput, MutationContext>({
    mutationFn: async (input) => {
      if (!user) throw new Error("Utilisateur non connecté");

      const row = {
        user_id: user.id,
        match_id: input.matchId,
        rating: input.rating,
        motm_player_id: input.motmPlayerId,
        comment: input.comment,
        watched_at: input.watchedAt,
      };

      // Hors-ligne détecté à l'avance : direct en queue, pas d'attente réseau
      // inutile. En ligne, une erreur (fetch échoué, coupure en cours de
      // requête) est traitée pareil plutôt que de perdre le log — la
      // validation côté client empêche déjà les données invalides, donc un
      // échec ici est presque toujours réseau, pas la peine de le classifier finement.
      if (!navigator.onLine) {
        await addPendingLog({
          userId: user.id,
          matchId: input.matchId,
          rating: input.rating,
          motmPlayerId: input.motmPlayerId,
          comment: input.comment,
          watchedAt: input.watchedAt,
        });
        return { queued: true };
      }

      const { error } = await supabase
        .from("logs")
        .upsert(row, { onConflict: "user_id,match_id" });

      if (error) {
        await addPendingLog({
          userId: user.id,
          matchId: input.matchId,
          rating: input.rating,
          motmPlayerId: input.motmPlayerId,
          comment: input.comment,
          watchedAt: input.watchedAt,
        });
        return { queued: true };
      }

      return { queued: false };
    },

    // La carte passe en "loggé" immédiatement, avant même de savoir si la
    // sauvegarde a réussi, échoué ou été mise en queue — c'est ce qui garde
    // le flow à 3 taps sans jamais attendre le réseau.
    onMutate: async (input) => {
      if (!user) return {};
      await queryClient.cancelQueries({ queryKey: myLogsKey });
      const previous = queryClient.getQueryData<Map<string, LogItem>>(myLogsKey);

      const optimistic: LogItem = {
        id: previous?.get(input.matchId)?.id ?? `optimistic-${input.matchId}`,
        match_id: input.matchId,
        rating: input.rating,
        motm_player_id: input.motmPlayerId,
        comment: input.comment,
        watched_at: input.watchedAt,
        pending: true,
      };

      queryClient.setQueryData<Map<string, LogItem>>(myLogsKey, (old) => {
        const next = new Map(old ?? []);
        next.set(input.matchId, optimistic);
        return next;
      });

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(myLogsKey, context.previous);
      }
    },

    onSuccess: (result) => {
      if (result.queued) {
        // Même en mode "queued" (échec réseau/insert), on veut que toutes
        // les pages (Journal + Stats) se re-synchronisent avec la source de
        // vérité (IndexedDB pending via useMyLogs).
        queryClient.invalidateQueries({ queryKey: myLogsKey });
        queryClient.invalidateQueries({ queryKey: ["pending-logs-count", user?.id] });
        showToast("Log enregistré — sera synchronisé dès que possible");
      } else {
        queryClient.invalidateQueries({ queryKey: myLogsKey });
        // Écriture confirmée côté serveur : les vues dérivées (moyenne
        // communautaire, profil public) peuvent être obsolètes. Rien à faire
        // côté "queued" ci-dessus : le serveur n'a pas encore la donnée.
        queryClient.invalidateQueries({ queryKey: ["community-averages"] });
        queryClient.invalidateQueries({ queryKey: ["public-profile-logs", user?.id] });
        showCelebrateToast("Log enregistré ✓");
      }
    },
  });
}
