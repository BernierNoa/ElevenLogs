import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { BadgesSummary } from "../components/badges/BadgesSummary";
import { BadgesGrid } from "../components/badges/BadgesGrid";
import { useBadges } from "../hooks/useBadges";

export function Badges() {
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { isLoading, isError, badges, unlockedCount } = useBadges();

  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Badges
        </h1>
        <p className="text-gris text-[13.5px] mt-2 max-w-[62ch] mb-5">
          Connecte-toi pour voir tes badges.
        </p>
        <Button onClick={() => navigate("/connexion")}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Badges
      </h1>

      {isLoading && <p className="text-gris-fonce text-[13px] mt-8">Chargement…</p>}

      {!isLoading && isError && (
        <p className="text-carton text-[13.5px] mt-8">
          Impossible de charger tes badges pour le moment.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="mt-6">
            <BadgesSummary unlockedCount={unlockedCount} total={badges.length} />
          </div>
          <BadgesGrid badges={badges} />
        </>
      )}
    </div>
  );
}
