import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

// Dépend de la policy RLS additive "Admin peut modérer les signalements"
// (20260815000000_add_admin_moderation.sql) — sans elle, `reports` était
// insert-only, aucun compte ne pouvait faire évoluer `status`.
export function useAdminReportActions() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
  }

  const setStatus = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: "reviewed" | "dismissed" }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { setStatus };
}
