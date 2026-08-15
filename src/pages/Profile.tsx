import { useMemo } from "react";
import { useClerk, useUser, UserProfile } from "@clerk/react-router";
import { useNavigate, Link } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useMyLogs } from "../hooks/useMyLogs";
import { useFollowCounts } from "../hooks/useFollowCounts";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { useUpdateProfileVisibility } from "../hooks/useUpdateProfileVisibility";
import { useBlockedUsersList } from "../hooks/useBlockedUsersList";
import { useBlockMutations } from "../hooks/useBlockMutations";
import { showToast } from "../lib/toastStore";

function SectionTitle({ children }: { children: string }) {
  return <h3 className="font-display font-bold text-[15px] mb-3">{children}</h3>;
}

export function Profile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { data: myLogs } = useMyLogs();
  const { data: followCounts } = useFollowCounts(user?.id);
  const { data: profileSettings } = useProfileSettings(user?.id);
  const updateVisibility = useUpdateProfileVisibility();
  const {
    data: blockedUsers,
    isLoading: blockedUsersLoading,
    isError: blockedUsersError,
    refetch: refetchBlockedUsers,
  } = useBlockedUsersList();
  const { unblock } = useBlockMutations();

  const noteMoyenne = useMemo(() => {
    if (!myLogs || myLogs.size === 0) return null;
    const sum = [...myLogs.values()].reduce((acc, log) => acc + log.rating, 0);
    return sum / myLogs.size;
  }, [myLogs]);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Profil
        </h1>
        <p className="text-gris text-[13.5px] mt-2 max-w-[62ch] mb-5">
          Connecte-toi pour voir ton profil.
        </p>
        <Button onClick={() => navigate("/connexion")}>Se connecter</Button>
      </div>
    );
  }

  const isPrivate = profileSettings?.profile_visibility === "private";

  function handleSetVisibility(visibility: "public" | "private") {
    updateVisibility.mutate(visibility, {
      onSuccess: () =>
        showToast(
          visibility === "private" ? "Profil passé en privé" : "Profil passé en public",
        ),
      onError: () => showToast("Action impossible pour l'instant."),
    });
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Profil
      </h1>

      <Card className="mt-6 flex items-center gap-4 flex-wrap">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            className="w-16 h-16 rounded-full object-cover shrink-0 border border-ligne"
          />
        ) : (
          <span className="w-16 h-16 rounded-full bg-nuit-haute shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-[18px] truncate">
            {user?.fullName ?? "—"}
          </div>
          <div className="text-gris text-[13px] truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {user?.id && (
            <Link to={`/u/${user.id}`}>
              <Button variant="secondaire" size="sm">
                Voir mon profil public
              </Button>
            </Link>
          )}
          <Button
            variant="destructif"
            size="sm"
            onClick={() => signOut(() => navigate("/"))}
          >
            Se déconnecter
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div className="carte px-5 py-3.5">
          <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] text-projecteur leading-none">
            {myLogs?.size ?? 0}
          </div>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-1.5">
            Matchs logués
          </div>
        </div>
        <div className="carte px-5 py-3.5">
          <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none">
            {noteMoyenne !== null ? noteMoyenne.toFixed(1) : "–"}
          </div>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-1.5">
            Note moyenne
          </div>
        </div>
        <div className="carte px-5 py-3.5">
          <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none">
            {followCounts?.followers ?? 0}
          </div>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-1.5">
            Abonnés
          </div>
        </div>
        <div className="carte px-5 py-3.5">
          <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none">
            {followCounts?.following ?? 0}
          </div>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-1.5">
            Abonnements
          </div>
        </div>
      </div>

      <p className="text-gris-fonce text-[12px] mt-3">
        Le détail complet de ta saison est sur{" "}
        <Link to="/stats" className="text-projecteur">
          Statistiques
        </Link>
        .
      </p>

      <div className="mt-8">
        <SectionTitle>Confidentialité</SectionTitle>
        <Card>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="max-w-[52ch]">
              <div className="font-display font-bold text-[14px]">
                {isPrivate ? "Profil privé" : "Profil public"}
              </div>
              <p className="text-gris-fonce text-[12.5px] mt-1">
                {isPrivate
                  ? "Tes logs ne sont visibles que par toi, même par les comptes qui te suivent. Ton nom et ta photo restent visibles pour permettre de te retrouver."
                  : "Tes logs marqués publics sont visibles par tout le monde, et comptent dans les comparaisons communautaires et la découverte."}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                className={["filtre-chip", !isPrivate ? "actif" : ""].join(" ")}
                disabled={updateVisibility.isPending}
                onClick={() => handleSetVisibility("public")}
              >
                Public
              </button>
              <button
                type="button"
                className={["filtre-chip", isPrivate ? "actif" : ""].join(" ")}
                disabled={updateVisibility.isPending}
                onClick={() => handleSetVisibility("private")}
              >
                Privé
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <SectionTitle>Comptes bloqués</SectionTitle>
        <Card>
          {blockedUsersLoading && (
            <p className="text-gris-fonce text-[13px]">Chargement…</p>
          )}

          {!blockedUsersLoading && blockedUsersError && (
            <div>
              <p className="text-carton text-[13px] mb-3">
                Impossible de charger les comptes bloqués. Réessaie plus tard.
              </p>
              <Button
                variant="secondaire"
                size="sm"
                onClick={() => refetchBlockedUsers()}
              >
                Réessayer
              </Button>
            </div>
          )}

          {!blockedUsersLoading &&
            !blockedUsersError &&
            (!blockedUsers || blockedUsers.length === 0) && (
              <p className="text-gris-fonce text-[13px]">
                Tu n'as bloqué aucun compte.
              </p>
            )}
          {!blockedUsersLoading && !blockedUsersError && blockedUsers && blockedUsers.length > 0 && (
            <div className="space-y-1">
              {blockedUsers.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between gap-2.5 py-2"
                >
                  <Link
                    to={`/u/${entry.userId}`}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-nuit-haute shrink-0" />
                    )}
                    <span className="text-[13.5px] font-semibold truncate">
                      {entry.displayName}
                    </span>
                  </Link>
                  <Button
                    variant="secondaire"
                    size="sm"
                    onClick={() =>
                      unblock.mutate(entry.userId, {
                        onError: () => showToast("Action impossible pour l'instant."),
                      })
                    }
                    isLoading={unblock.isPending}
                  >
                    Débloquer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <SectionTitle>Compte &amp; sécurité</SectionTitle>
        <UserProfile routing="path" path="/profil" />
      </div>
    </div>
  );
}
