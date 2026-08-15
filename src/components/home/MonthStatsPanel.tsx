import { useNavigate } from "react-router";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { LedRatingBar } from "../LedRatingBar";
import type { MonthStats } from "../../hooks/useMonthStats";

export interface MonthStatsPanelProps {
  stats: MonthStats;
}

function lastMonthLabel(): string {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(lastMonth);
}

export function MonthStatsPanel({ stats }: MonthStatsPanelProps) {
  const navigate = useNavigate();
  const { matchsVus, noteMoyenne, matchsVusLastMonth, equipePlusVue } = stats;

  if (matchsVus === 0) {
    return (
      <Card>
        <div className="font-display font-bold text-[15px]">
          Rien loggé ce mois-ci pour l'instant
        </div>
        <p className="text-gris-fonce text-[13px] mt-1.5 max-w-[48ch]">
          Le prochain match que tu regardes, notes-le : ça prend 3 taps, et
          c'est le début de tes stats du mois.
        </p>
        <Button size="sm" className="mt-4" onClick={() => navigate("/matchs")}>
          Voir les matchs
        </Button>
      </Card>
    );
  }

  const delta = matchsVus - matchsVusLastMonth;
  const deltaLabel =
    delta === 0
      ? `= vs ${lastMonthLabel()}`
      : `${delta > 0 ? "+" : ""}${delta} vs ${lastMonthLabel()}`;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em]">
            Matchs vus
          </div>
          <div className="chiffres font-display font-black [font-stretch:118%] text-[38px] leading-none text-projecteur mt-2">
            {matchsVus}
          </div>
          <div className="font-data text-[10.5px] text-gris-fonce mt-1.5">
            {deltaLabel}
          </div>
        </Card>

        <Card>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em]">
            Note moyenne
          </div>
          <div className="mt-2.5">
            <LedRatingBar
              value={noteMoyenne !== null ? Math.round(noteMoyenne * 10) / 10 : null}
              size="compact"
              showValue
            />
          </div>
        </Card>
      </div>

      {equipePlusVue && (
        <Card className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em]">
                Équipe la plus vue ce mois
              </div>
              <div className="font-display font-bold [font-stretch:104%] text-[16px] mt-1.5 truncate">
                {equipePlusVue}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
