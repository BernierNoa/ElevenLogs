import { useMemo } from "react";
import { useSession } from "@clerk/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Client anonyme pour les tables en lecture publique (référentiel football :
// competitions/teams/matches/players/lineups, policy RLS `using (true)`).
// Pas de useSession() ici : ClerkProvider ne couvre que /connexion et
// /inscription, ce client doit donc rester utilisable partout ailleurs.
export const supabasePublic: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
);

// accessToken() lit `session` à l'appel (toujours à jour) — le memo ne doit
// se recalculer que si l'id de session change, pas à chaque refresh de token.
// Réservé aux données propres à l'utilisateur (RLS scopée à son identité) —
// nécessite d'être rendu sous ClerkProvider.
export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(supabaseUrl, supabaseAnonKey, {
        accessToken: async () => (await session?.getToken()) ?? null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.id],
  );
}
