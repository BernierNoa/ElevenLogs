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

      // RPC server-side : évite tout problème de mismatch entre Clerk
      // user.id côté client et auth.jwt()->>'sub' côté RLS.
      const { error } = await supabase.rpc("follow_user", {
        target_user_id: targetUserId,
      });

      if (error) throw error;
    },
    retry: shouldRetry,
    retryDelay: RETRY_DELAY_MS,
    onMutate: (targetUserId) => optimisticToggle(targetUserId, true),
    onError: async (_err, targetUserId, context) => {
      rollback(context);
      const msg = _err?.message ?? "Action impossible pour l'instant.";
      console.error("[useFollowMutations] follow error", {
        targetUserId,
        message: msg,
        userId: user?.id,
      });

      // Note volontaire : ne JAMAIS révéler ici si `target` a bloqué
      // l'utilisateur courant — un ancien code de diagnostic affichait un
      // "blocks entre comptes: oui/non" bidirectionnel dans ce toast, ce
      // qui permettait à n'importe qui de savoir qu'il avait été bloqué par
      // quelqu'un simplement en tentant de le suivre. Ça contredit la règle
      // même du blocage (invisible pour la personne bloquée, cf.
      // add_social_guardrails.sql) — le message ci-dessous ne confirme donc
      // jamais que le blocage vient de l'autre compte, seulement du sien.

      // RLS sur `follows` vient très souvent d'un blocage actif
      // (la policy interdit si une ligne existe dans `blocks` dans un sens
      // ou l'autre).
      if (msg.includes('violates row-level security policy for table "follows"')) {
        try {
          const [myBlock, alreadyFollowing] = await Promise.all([
            supabase
              .from("blocks")
              .select("blocked_id")
              .eq("blocker_id", user!.id)
              .eq("blocked_id", targetUserId)
              .maybeSingle(),
            supabase
              .from("follows")
              .select("followed_id")
              .eq("follower_id", user!.id)
              .eq("followed_id", targetUserId)
              .maybeSingle(),
          ]);

          if (myBlock.data) {
            showToast(
              "Impossible de suivre : tu as bloqué ce compte (bloquer empêche le follow).",
            );
            return;
          }

          if (alreadyFollowing.data) {
            showToast("Tu suis déjà ce compte.");
            return;
          }

          showToast(
            "Impossible de suivre : la relation est refusée (l'autre compte t'a peut-être bloqué).",
            {
              label: "Réessayer",
              onClick: () => follow.mutate(targetUserId),
            },
          );
          return;
        } catch {
          // Fallback : message brut.
        }
      }

      showToast(`Impossible de suivre : ${msg}` , {
        label: "Réessayer",
        onClick: () => follow.mutate(targetUserId),
      });
    },
    onSuccess: invalidate,
  });

  const unfollow = useMutation<void, Error, string, FollowContext>({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error(NOT_SIGNED_IN_MESSAGE);

      const { error } = await supabase.rpc("unfollow_user", {
        target_user_id: targetUserId,
      });
      if (error) throw error;
    },
    retry: shouldRetry,
    retryDelay: RETRY_DELAY_MS,
    onMutate: (targetUserId) => optimisticToggle(targetUserId, false),
    onError: (_err, targetUserId, context) => {
      rollback(context);
      const msg = _err?.message ?? "Action impossible pour l'instant.";
      console.error("[useFollowMutations] unfollow error", { targetUserId, message: msg });

      showToast(`Impossible de ne plus suivre : ${msg}`, {
        label: "Réessayer",
        onClick: () => unfollow.mutate(targetUserId),
      });
    },
    onSuccess: invalidate,
  });

  return { follow, unfollow };
}
