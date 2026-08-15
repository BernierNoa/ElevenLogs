import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export interface CustomMatchItem {
  id: string;
  name: string;
  kickoffAt: string | null;
  position: number;
}

export interface CustomLogItem {
  id: string;
  rating: number;
  comment: string | null;
  watchedAt: string;
  createdAt: string;
  matches: CustomMatchItem[];
}

interface RawCustomLogRow {
  id: string;
  rating: number;
  comment: string | null;
  watched_at: string;
  created_at: string;
  custom_matches: {
    id: string;
    name: string;
    kickoff_at: string | null;
    position: number;
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
        .select("id, rating, comment, watched_at, created_at, custom_matches(id, name, kickoff_at, position)")
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
          matches: [...r.custom_matches]
            .sort((a, b) => a.position - b.position)
            .map((m) => ({
              id: m.id,
              name: m.name,
              kickoffAt: m.kickoff_at,
              position: m.position,
            })),
        };
      });
    },
  });
}
