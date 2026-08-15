import { useEffect } from "react";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

// Clerk n'expose le nom/avatar que de l'utilisateur courant côté client :
// c'est ce qui permet aux AUTRES de voir qui on est (fil, profil public).
// `profile_visibility` n'est jamais inclus dans ce upsert — s'il l'était, il
// écraserait le réglage de confidentialité de l'utilisateur à chaque login.
export function ProfileSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    supabase
      .from("profile_settings")
      .upsert(
        {
          user_id: user.id,
          display_name:
            user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Utilisateur",
          avatar_url: user.imageUrl ?? null,
        },
        { onConflict: "user_id" },
      )
      .then(({ error }) => {
        if (error) console.error("ProfileSync :", error.message);
      });
  }, [isLoaded, isSignedIn, user, supabase]);

  return null;
}
