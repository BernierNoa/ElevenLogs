import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

export interface AdminReportRow {
  id: string;
  reporterId: string;
  reporterDisplayName: string;
  targetUserId: string;
  targetDisplayName: string;
  reason: string;
  status: string;
  createdAt: string;
  logRating: number | null;
  logComment: string | null;
  matchLabel: string;
}

interface RawReportRow {
  id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  log: {
    user_id: string;
    rating: number;
    comment: string | null;
    match: {
      home_team: { name: string } | null;
      away_team: { name: string } | null;
    } | null;
  } | null;
}

// Réservé à l'admin : `reports` n'a aucune policy select pour les autres
// comptes (insert-only par design). Le join vers `logs`/`matches`/`teams`
// dépend lui aussi des policies de lecture complète posées pour ce même
// compte admin — cf. 20260727000000_add_admin_access.sql.
export function useAdminReports() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["admin-reports"],
    queryFn: async (): Promise<AdminReportRow[]> => {
      const { data, error } = await supabase
        .from("reports")
        .select(
          "id, reporter_id, reason, status, created_at, log:logs(user_id, rating, comment, match:matches(home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as unknown as RawReportRow[];
      if (rows.length === 0) return [];

      const userIds = new Set<string>();
      for (const r of rows) {
        userIds.add(r.reporter_id);
        if (r.log?.user_id) userIds.add(r.log.user_id);
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profile_settings")
        .select("user_id, display_name")
        .in("user_id", [...userIds]);
      if (profilesError) throw profilesError;

      const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

      return rows.map((r) => ({
        id: r.id,
        reporterId: r.reporter_id,
        reporterDisplayName: nameById.get(r.reporter_id) ?? "?",
        targetUserId: r.log?.user_id ?? "",
        targetDisplayName: r.log?.user_id ? (nameById.get(r.log.user_id) ?? "?") : "Log supprimé",
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        logRating: r.log?.rating ?? null,
        logComment: r.log?.comment ?? null,
        matchLabel: r.log?.match
          ? `${r.log.match.home_team?.name ?? "?"} – ${r.log.match.away_team?.name ?? "?"}`
          : "Match personnalisé / supprimé",
      }));
    },
  });
}
