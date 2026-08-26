import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export type BugType = "affichage" | "fonctionnalite" | "donnees" | "autre";

export interface BugReportInput {
  bugType: BugType;
  description: string;
}

// Insert-only côté RLS, comme `reports` (useReportMutation) : aucune policy
// select pour le rapporteur, la relecture se fait uniquement depuis /admin.
export function useBugReportMutation() {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ bugType, description }: BugReportInput) => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase.from("bug_reports").insert({
        reporter_id: user.id,
        bug_type: bugType,
        description,
        page_url: window.location.pathname,
      });
      if (error) throw error;
    },
  });
}
