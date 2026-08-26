import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

// Dépend de la policy "Admin peut traiter les signalements de bug"
// (20260826010000_add_bug_reports.sql).
export function useAdminBugReportActions() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-bug-reports"] });
  }

  const setStatus = useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: "reviewed" | "resolved";
    }) => {
      const { error } = await supabase.from("bug_reports").update({ status }).eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { setStatus };
}
