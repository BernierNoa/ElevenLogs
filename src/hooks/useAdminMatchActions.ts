import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

// renameTeam dépend de la policy RLS additive "Admin peut corriger une
// équipe" (20260815010000_add_admin_teams_update.sql) — `teams` était en
// lecture publique uniquement avant ça. La correction porte sur la ligne
// `teams`, donc s'applique à tous les matchs de cette équipe, pas seulement
// celui affiché dans l'UI d'où vient l'action.
export function useAdminMatchActions() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  function invalidateMatches() {
    queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
    queryClient.invalidateQueries({ queryKey: ["matches"] });
  }

  const renameTeam = useMutation({
    mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
      const { error } = await supabase.from("teams").update({ name }).eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: invalidateMatches,
  });

  // Un seul DELETE ... WHERE id IN (...) : si un des matchs sélectionnés a
  // déjà des logs (FK RESTRICT sur logs.match_id), toute la suppression
  // groupée échoue plutôt que d'en effacer une partie en silence — l'admin
  // doit alors retirer ce match de la sélection et réessayer.
  const bulkDeleteMatches = useMutation({
    mutationFn: async (matchIds: string[]) => {
      const { error } = await supabase.from("matches").delete().in("id", matchIds);
      if (error) throw error;
    },
    onSuccess: invalidateMatches,
  });

  return { renameTeam, bulkDeleteMatches };
}
