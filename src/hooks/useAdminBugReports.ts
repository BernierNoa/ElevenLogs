import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import type { BugType } from "./useBugReportMutation";

export interface AdminBugReportRow {
  id: string;
  reporterId: string;
  reporterDisplayName: string;
  bugType: BugType;
  description: string;
  pageUrl: string | null;
  status: string;
  createdAt: string;
}

interface RawBugReportRow {
  id: string;
  reporter_id: string;
  bug_type: BugType;
  description: string;
  page_url: string | null;
  status: string;
  created_at: string;
}

// Réservé à l'admin : `bug_reports` n'a aucune policy select pour les
// autres comptes (insert-only par design, cf. useAdminReports pour le même
// pattern sur `reports`).
export function useAdminBugReports() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["admin-bug-reports"],
    queryFn: async (): Promise<AdminBugReportRow[]> => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("id, reporter_id, bug_type, description, page_url, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as RawBugReportRow[];
      if (rows.length === 0) return [];

      const reporterIds = [...new Set(rows.map((r) => r.reporter_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profile_settings")
        .select("user_id, display_name")
        .in("user_id", reporterIds);
      if (profilesError) throw profilesError;

      const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

      return rows.map((r) => ({
        id: r.id,
        reporterId: r.reporter_id,
        reporterDisplayName: nameById.get(r.reporter_id) ?? "?",
        bugType: r.bug_type,
        description: r.description,
        pageUrl: r.page_url,
        status: r.status,
        createdAt: r.created_at,
      }));
    },
  });
}
