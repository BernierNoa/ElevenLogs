import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { showToast } from "../lib/toastStore";

// Le toggle suivre/ne plus suivre est un tap unique répété partout dans
// l'app (fil, découverte, recherche, profils) : 1-2 tentatives auto avec un
// délai court suffisent à absorber un aller-retour réseau raté sans faire
// attendre l'utilisateur ni le forcer à retaper l'action lui-même.
const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 400;
const NOT_SIGNED_IN_MESSAGE = "Utilisateur non connecté";

interface FollowContext {
  previous?: Set<string>;
}

// Retenter une session expirée ne sert à rien : le prochain essai échouera
// pour la même raison, autant remonter l'erreur tout de suite.
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error.message === NOT_SIGNED_IN_MESSAGE) return false;
  return failureCount < RETRY_COUNT;
}

export function useFollowMutations() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const followingKey = ["following", user?.id] as const;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["following"] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
  };

  // Bascule l'état local immédiatement (le tap doit rester à 3 taps max sans
  // jamais attendre le réseau) et renvoie l'ancien Set pour un rollback
  // exact si la mutation échoue après épuisement des tentatives.
  async function optimisticToggle(
    targetUserId: string,
    nextIsFollowing: boolean,
  ): Promise<FollowContext> {
    if (!user) return {};
    await queryClient.cancelQueries({ queryKey: followingKey });
    const previous = queryClient.getQueryData<Set<string>>(followingKey);
    queryClient.setQueryData<Set<string>>(followingKey, (old) => {
      const next = new Set(old ?? []);
      if (nextIsFollowing) next.add(targetUserId);
      else next.delete(targetUserId);
      return next;
    });
    return { previous };
  }

  function rollback(context: FollowContext | undefined) {
    if (context?.previous) {
      queryClient.setQueryData(followingKey, context.previous);
    }
  }

  const follow = useMutation<void, Error, string, FollowContext>({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error(NOT_SIGNED_IN_MESSAGE);
      // upsert + ignoreDuplicates plutôt qu'un insert simple : si une
      // tentative précédente a en fait réussi côté serveur mais que sa
      // réponse s'est perdue (coupure), le retry ne doit pas se prendre une
      // violation de contrainte unique et déclencher un rollback pour une
      // action qui a réellement abouti.
      const { error } = await supabase
        .from("follows")
        .upsert(
          { follower_id: user.id, followed_id: targetUserId },
          { onConflict: "follower_id,followed_id", ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    retry: shouldRetry,
    retryDelay: RETRY_DELAY_MS,
    onMutate: (targetUserId) => optimisticToggle(targetUserId, true),
    onError: (_err, targetUserId, context) => {
      rollback(context);
      showToast("Impossible de suivre ce compte pour l'instant.", {
        label: "Réessayer",
        onClick: () => follow.mutate(targetUserId),
      });
    },
    onSuccess: invalidate,
  });

  const unfollow = useMutation<void, Error, string, FollowContext>({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error(NOT_SIGNED_IN_MESSAGE);
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("followed_id", targetUserId);
      if (error) throw error;
    },
    retry: shouldRetry,
    retryDelay: RETRY_DELAY_MS,
    onMutate: (targetUserId) => optimisticToggle(targetUserId, false),
    onError: (_err, targetUserId, context) => {
      rollback(context);
      showToast("Impossible de ne plus suivre ce compte pour l'instant.", {
        label: "Réessayer",
        onClick: () => unfollow.mutate(targetUserId),
      });
    },
    onSuccess: invalidate,
  });

  return { follow, unfollow };
}
