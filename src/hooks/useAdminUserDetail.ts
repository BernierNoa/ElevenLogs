import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

export interface AdminUserDetailLog {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  matchLabel: string;
}

export interface AdminUserDetailReport {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  matchLabel: string;
}

export interface AdminUserDetail {
  logs: AdminUserDetailLog[];
  reportsReceived: AdminUserDetailReport[];
  reportsMade: AdminUserDetailReport[];
}

const LOGS_LIMIT = 50;

interface LogRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  match: {
    home_team: { name: string } | null;
    away_team: { name: string } | null;
  } | null;
}

interface ReportRow {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  log: {
    match: {
      home_team: { name: string } | null;
      away_team: { name: string } | null;
    } | null;
  } | null;
}

function matchLabelFrom(match: { home_team: { name: string } | null; away_team: { name: string } | null } | null): string {
  if (!match) return "Match personnalisé / supprimé";
  return `${match.home_team?.name ?? "?"} – ${match.away_team?.name ?? "?"}`;
}

// Réservé à l'admin : dépend des mêmes policies additives que useAdminStats
// (lecture complète de `logs`) et useAdminReports (lecture complète de
// `reports`) — aucune requête supplémentaire côté RLS à ajouter.
export function useAdminUserDetail(userId: string | null) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["admin-user-detail", userId],
    enabled: !!userId,
    queryFn: async (): Promise<AdminUserDetail> => {
      const [logsRes, receivedRes, madeRes] = await Promise.all([
        supabase
          .from("logs")
          .select(
            "id, rating, comment, created_at, match:matches(home_team:teams!home_team_id(name), away_team:teams!away_team_id(name))",
          )
          .eq("user_id", userId as string)
          .order("created_at", { ascending: false })
          .limit(LOGS_LIMIT),
        supabase
          .from("reports")
          .select(
            "id, reason, status, created_at, log:logs!inner(user_id, match:matches(home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)))",
          )
          .eq("log.user_id", userId as string),
        supabase
          .from("reports")
          .select(
            "id, reason, status, created_at, log:logs(match:matches(home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)))",
          )
          .eq("reporter_id", userId as string),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (receivedRes.error) throw receivedRes.error;
      if (madeRes.error) throw madeRes.error;

      const logs = ((logsRes.data ?? []) as unknown as LogRow[]).map((l) => ({
        id: l.id,
        rating: l.rating,
        comment: l.comment,
        createdAt: l.created_at,
        matchLabel: matchLabelFrom(l.match),
      }));

      const toReport = (r: ReportRow): AdminUserDetailReport => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        matchLabel: matchLabelFrom(r.log?.match ?? null),
      });

      return {
        logs,
        reportsReceived: ((receivedRes.data ?? []) as unknown as ReportRow[]).map(toReport),
        reportsMade: ((madeRes.data ?? []) as unknown as ReportRow[]).map(toReport),
      };
    },
  });
}
