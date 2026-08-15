import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export interface ReportInput {
  logId: string;
  reason: string;
}

// Insert-only côté RLS : aucune policy select sur `reports`, donc ce hook
// ne peut jamais relire un signalement, ici ou ailleurs — la modération se
// fait manuellement, hors client.
export function useReportMutation() {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ logId, reason }: ReportInput) => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase
        .from("reports")
        .insert({ reporter_id: user.id, log_id: logId, reason });
      if (error) throw error;
    },
  });
}
