import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { getPendingLogsForUser } from "../lib/pendingLogsDb";

export interface LogItem {
  id: string;
  match_id: string;
  rating: number;
  motm_player_id: string | null;
  comment: string | null;
  watched_at: string;
  // Vrai uniquement pour une entrée optimiste pas encore confirmée côté
  // serveur (en ligne : le temps de l'aller-retour réseau ; hors-ligne : tant
  // que la synchro différée n'a pas abouti). Jamais persisté en base.
  pending?: boolean;
}

// Une seule requête pour tous les logs de l'utilisateur courant plutôt
// qu'une requête par carte de match affichée.
export function useMyLogs() {
  const supabase = useSupabaseClient();
  const { user, isLoaded, isSignedIn } = useUser();

  return useQuery({
    // La clé DOIT inclure l'id utilisateur : sans ça, changer de compte dans
    // le même onglet (sans rechargement complet) laisse React Query servir
    // le cache de l'ancien compte, et la mise à jour optimiste de
    // useSaveLog fusionne alors le nouveau log dedans — d'où des
    // statistiques mélangeant les deux comptes.
    queryKey: ["my-logs", user?.id],
    enabled: isLoaded && !!isSignedIn,
    queryFn: async (): Promise<Map<string, LogItem>> => {
      if (!user) return new Map();

      // Filtre explicite indispensable : la policy RLS de lecture sur
      // `logs` autorise volontairement à la fois ses propres logs ET les
      // logs publics des comptes à profil public (nécessaire pour le fil
      // d'activité / la comparaison communautaire ailleurs dans l'app).
      // Sans ce `.eq`, ce hook censé ne renvoyer que "mes logs" recevait en
      // réalité "mes logs + tous les logs publics de la plateforme".
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      const logs = new Map((data ?? []).map((log: LogItem) => [log.match_id, log]));

      // Une entrée mise en attente hors-ligne (IndexedDB) ne devient une
      // ligne `logs` qu'après le passage d'OfflineSyncManager. Sans ce
      // merge, un rechargement à froid avant cette synchro fait perdre la
      // trace du match côté cache : il réapparaît comme "à loguer" dans le
      // rattrapage 72h et perd son état "en attente" sur sa carte.
      const pending = await getPendingLogsForUser(user.id);
      for (const entry of pending) {
        if (logs.has(entry.matchId)) continue;
        logs.set(entry.matchId, {
          id: `pending-${entry.localId}`,
          match_id: entry.matchId,
          rating: entry.rating,
          motm_player_id: entry.motmPlayerId,
          comment: entry.comment,
          watched_at: entry.watchedAt,
          pending: true,
        });
      }

      console.debug(
        `[useMyLogs] ${data?.length ?? 0} log(s) en base, ${pending.length} en attente (IndexedDB), ${logs.size} au total pour ${user.id}`,
      );

      return logs;
    },
  });
}
