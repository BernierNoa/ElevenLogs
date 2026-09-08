import { useState } from "react";
import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { SeasonStatsView } from "../components/SeasonStatsView";
import { StatsShareModal } from "../components/StatsShareModal";
import { useSeasonStats } from "../hooks/useSeasonStats";
import { useLogStreak } from "../hooks/useLogStreak";

export function Stats() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const stats = useSeasonStats();
  const streak = useLogStreak();
  const [showShareModal, setShowShareModal] = useState(false);

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

  const hasNoLogs = stats.matchsVus === 0 && stats.customLogsCount === 0;

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Ta saison
        </h1>
        {!hasNoLogs && (
          <Button variant="secondaire" size="sm" onClick={() => setShowShareModal(true)}>
            Partager mes stats
          </Button>
        )}
      </div>

      {showShareModal && (
        <StatsShareModal stats={stats} streak={streak} onClose={() => setShowShareModal(false)} />
      )}

      {hasNoLogs ? (
        <div className="carte p-5 mt-6">
          <div className="font-display font-bold text-[15px]">
            Rien à afficher pour l'instant
          </div>
          <p className="text-gris-fonce text-[13px] mt-1 max-w-[52ch]">
            Tes statistiques (note moyenne, séries, classements) apparaissent
            dès que tu as loggué au moins un match.
          </p>
          <Button onClick={() => navigate("/matchs")} className="mt-4">
            Voir les matchs
          </Button>
        </div>
      ) : (
        user && <SeasonStatsView stats={stats} logOwnerId={user.id} streak={streak} />
      )}
    </div>
  );
}
