import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import type { LogItem } from "./useMyLogs";

// Contrepartie de useMyLogs pour un utilisateur arbitraire (onglet Stats du
// profil public) : même forme brute (Map<match_id, LogItem>), mais sans la
// fusion avec la queue offline (pending) — celle-ci n'a de sens que pour le
// compte actuellement connecté, jamais pour un profil consulté à distance.
// RLS sur `logs` fait le tri exact (ses propres logs, ou logs publics d'un
// profil public non bloqué) — même garde-fou que usePublicProfileLogs.
export function useLogsByUserId(userId: string | undefined, enabled: boolean) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["logs-by-user", userId],
    enabled: enabled && !!userId,
    queryFn: async (): Promise<Map<string, LogItem>> => {
      const { data, error } = await supabase
        .from("logs")
        .select("id, match_id, rating, motm_player_id, comment, watched_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Map((data ?? []).map((log: LogItem) => [log.match_id, log]));
    },
  });
}
