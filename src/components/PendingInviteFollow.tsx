import { useEffect, useRef } from "react";
import { useUser } from "@clerk/react-router";
import { useFollowMutations } from "../hooks/useFollowMutations";
import { consumePendingInvite } from "../lib/inviteStorage";

// Consomme le lien d'invitation stocké par PublicProfile (?invite=1) une
// fois l'utilisateur connecté — potentiellement sur une toute autre page
// que celle où le paramètre est arrivé, après le passage par Clerk
// (redirection OAuth, vérification d'email...). `consumePendingInvite`
// retire l'entrée dès la lecture, donc au plus une tentative par lien
// cliqué, même si ce composant se remonte plusieurs fois dans la session.
export function PendingInviteFollow() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { follow } = useFollowMutations();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || attempted.current) return;

    const inviterId = consumePendingInvite();
    if (!inviterId || inviterId === user.id) return;

    attempted.current = true;
    follow.mutate(inviterId);
  }, [isLoaded, isSignedIn, user, follow]);

  return null;
}
