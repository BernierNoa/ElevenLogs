import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { showCelebrateToast, showToast } from "../lib/toastStore";

export interface SaveCustomLogMatchInput {
  name: string;
  kickoffAt: string | null;
  /** Renseigné pour un match du référentiel sélectionné via
   * MultiplexMatchPicker — absent pour un match personnalisé saisi librement. */
  matchId?: string | null;
}

export interface SaveCustomLogInput {
  /** Absent = création, présent = édition d'une revue existante. */
  id?: string;
  rating: number;
  comment: string | null;
  watchedAt: string;
  matches: SaveCustomLogMatchInput[];
  /** MVP du multiplex, choisi parmi les compos des matchs sélectionnés —
   * toujours null pour un match personnalisé. */
  motmPlayerId?: string | null;
}

// Pas de transaction multi-tables côté client Supabase : en édition, on
// remplace les matchs enfants (delete + insert) plutôt que de differ un set
// contre l'autre — les revues perso restent petites (quelques matchs), donc
// le coût est négligeable et ça évite toute logique de diff.
export function useSaveCustomLog() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const customLogsKey = ["custom-logs", user?.id] as const;

  return useMutation({
    mutationFn: async (input: SaveCustomLogInput) => {
      if (!user) throw new Error("Utilisateur non connecté");
      if (input.matches.length === 0) {
        throw new Error("Au moins un match est requis");
      }

      let customLogId = input.id;

      const motmPlayerId = input.motmPlayerId ?? null;

      if (customLogId) {
        const { error } = await supabase
          .from("custom_logs")
          .update({
            rating: input.rating,
            comment: input.comment,
            watched_at: input.watchedAt,
            motm_player_id: motmPlayerId,
          })
          .eq("id", customLogId);
        if (error) throw error;

        const { error: deleteError } = await supabase
          .from("custom_matches")
          .delete()
          .eq("custom_log_id", customLogId);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from("custom_logs")
          .insert({
            user_id: user.id,
            rating: input.rating,
            comment: input.comment,
            watched_at: input.watchedAt,
            motm_player_id: motmPlayerId,
          })
          .select("id")
          .single();
        if (error) throw error;
        customLogId = data.id as string;
      }

      const { error: matchesError } = await supabase.from("custom_matches").insert(
        input.matches.map((match, index) => ({
          custom_log_id: customLogId,
          name: match.name,
          kickoff_at: match.kickoffAt,
          match_id: match.matchId ?? null,
          position: index,
        })),
      );
      if (matchesError) throw matchesError;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customLogsKey });
      showCelebrateToast("Revue enregistrée ✓");
    },

    onError: () => {
      showToast("Échec de l'enregistrement, réessaie");
    },
  });
}
