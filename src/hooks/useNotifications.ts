import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient, supabasePublic } from "../lib/supabase";

export interface NotificationItem {
  id: string;
  type: "follow" | "like";
  actorId: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
  logId: string | null;
  matchLabel: string | null;
  readAt: string | null;
  createdAt: string;
}

interface RawNotificationRow {
  id: string;
  type: "follow" | "like";
  actor_id: string;
  log_id: string | null;
  read_at: string | null;
  created_at: string;
  log: {
    match: {
      home_team: { name: string } | null;
      away_team: { name: string } | null;
    } | null;
  } | null;
}

const LIMIT = 30;

// En deux temps : la table n'a pas de FK vers profile_settings (cf. la
// migration — un trigger qui échoue sur cette FK romprait le follow/like
// d'origine), donc pas d'embed PostgREST possible pour le nom/avatar de
// l'acteur, comme pour useBlockedUsersList.
export function useNotifications(enabled: boolean) {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: enabled && !!user,
    queryFn: async (): Promise<NotificationItem[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id, type, actor_id, log_id, read_at, created_at,
          log:logs(
            match:matches(
              home_team:teams!home_team_id(name),
              away_team:teams!away_team_id(name)
            )
          )
        `,
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (error) throw error;

      const rows = (data ?? []) as unknown as RawNotificationRow[];
      const actorIds = [...new Set(rows.map((r) => r.actor_id))];

      const { data: profiles, error: profilesError } = actorIds.length
        ? await supabasePublic
            .from("profile_settings")
            .select("user_id, display_name, avatar_url")
            .in("user_id", actorIds)
        : { data: [], error: null };
      if (profilesError) throw profilesError;

      const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      return rows.map((row) => {
        const profile = profileById.get(row.actor_id);
        const home = row.log?.match?.home_team?.name;
        const away = row.log?.match?.away_team?.name;
        return {
          id: row.id,
          type: row.type,
          actorId: row.actor_id,
          actorDisplayName: profile?.display_name ?? "Utilisateur",
          actorAvatarUrl: profile?.avatar_url ?? null,
          logId: row.log_id,
          matchLabel: home && away ? `${home} – ${away}` : null,
          readAt: row.read_at,
          createdAt: row.created_at,
        };
      });
    },
  });
}
