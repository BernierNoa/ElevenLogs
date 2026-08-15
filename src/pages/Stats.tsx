import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { SeasonStatsView } from "../components/SeasonStatsView";
import { useSeasonStats } from "../hooks/useSeasonStats";
import { useLogStreak } from "../hooks/useLogStreak";

export function Stats() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const stats = useSeasonStats();
  const streak = useLogStreak();

  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Ta saison
        </h1>
        <p className="text-gris text-[13.5px] mt-2 max-w-[62ch] mb-5">
          Connecte-toi pour voir tes statistiques.
        </p>
        <Button onClick={() => navigate("/connexion")}>Se connecter</Button>
      </div>
    );
  }

  if (stats.isLoading) {
    return (
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Ta saison
        </h1>
        <p className="text-gris-fonce text-[13px] mt-8">Chargement…</p>
      </div>
    );
  }

  if (stats.isError) {
    return (
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Ta saison
        </h1>
        <p className="text-carton text-[13.5px] mt-2 max-w-[62ch]">
          Impossible de charger tes statistiques pour le moment.
        </p>
        <Button variant="secondaire" onClick={() => stats.refetch()} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Ta saison
      </h1>

      {user && <SeasonStatsView stats={stats} logOwnerId={user.id} streak={streak} />}
    </div>
  );
}
