import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

const POLL_INTERVAL_MS = 60_000;

// Pas de temps réel (pas de websocket dans ce projet) : un polling léger
// suffit pour un badge de compteur, cohérent avec le reste de l'app
// (aucune fonctionnalité ne dépend d'une mise à jour instantanée).
export function useUnreadNotificationCount() {
  const supabase = useSupabaseClient();
  const { user, isLoaded, isSignedIn } = useUser();

  return useQuery({
    queryKey: ["unread-notifications-count", user?.id],
    enabled: isLoaded && !!isSignedIn,
    refetchInterval: POLL_INTERVAL_MS,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
