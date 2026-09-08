import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export interface CustomMatchItem {
  id: string;
  name: string;
  kickoffAt: string | null;
  position: number;
  /** Renseigné quand ce match vient du référentiel (multiplex nouvelle
   * formule) — null pour un match personnalisé saisi librement. */
  matchId: string | null;
}

export interface CustomLogItem {
  id: string;
  rating: number;
  comment: string | null;
  watchedAt: string;
  createdAt: string;
  matches: CustomMatchItem[];
  motmPlayerId: string | null;
  motmName: string | null;
}

interface RawCustomLogRow {
  id: string;
  rating: number;
  comment: string | null;
  watched_at: string;
  created_at: string;
  motm_player_id: string | null;
  motm: { full_name: string } | null;
  custom_matches: {
    id: string;
    name: string;
    kickoff_at: string | null;
    position: number;
    match_id: string | null;
  }[];
}

// Comme useMyLogs : la clé DOIT inclure l'id utilisateur pour éviter de
// servir le cache d'un autre compte après un changement de session dans le
// même onglet.
export function useCustomLogs() {
  const supabase = useSupabaseClient();
  const { user, isLoaded, isSignedIn } = useUser();

  return useQuery({
    queryKey: ["custom-logs", user?.id],
    enabled: isLoaded && !!isSignedIn,
    queryFn: async (): Promise<CustomLogItem[]> => {
      const { data, error } = await supabase
        .from("custom_logs")
        .select(
          "id, rating, comment, watched_at, created_at, motm_player_id, motm:players(full_name), custom_matches(id, name, kickoff_at, position, match_id)",
        )
        .eq("user_id", user!.id)
        .order("watched_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((row: unknown) => {
        const r = row as RawCustomLogRow;
        return {
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          watchedAt: r.watched_at,
          createdAt: r.created_at,
          motmPlayerId: r.motm_player_id,
          motmName: r.motm?.full_name ?? null,
          matches: [...r.custom_matches]
            .sort((a, b) => a.position - b.position)
            .map((m) => ({
              id: m.id,
              name: m.name,
              kickoffAt: m.kickoff_at,
              position: m.position,
              matchId: m.match_id,
            })),
        };
      });
    },
  });
}
