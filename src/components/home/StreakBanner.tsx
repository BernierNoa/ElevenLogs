import { useNavigate } from "react-router";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import type { WeeklyStreak } from "../../hooks/useWeeklyStreak";

export interface StreakBannerProps {
  streak: WeeklyStreak;
}

export function StreakBanner({ streak }: StreakBannerProps) {
  const navigate = useNavigate();
  const { weeks, streakWeeks, isAtRisk } = streak;

  const headline =
    streakWeeks > 0
      ? `${streakWeeks} semaine${streakWeeks > 1 ? "s" : ""} de suite`
      : "Aucune série en cours";

  const message = isAtRisk
    ? "Ta série est en jeu — logge un match cette semaine pour la garder."
    : streakWeeks > 0
      ? "Continue comme ça, garde ta série vivante."
      : "Logge au moins un match cette semaine pour lancer une série.";

  return (
    <Card className={isAtRisk ? "border-projecteur-fonce" : undefined}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className={`text-[26px] leading-none shrink-0 ${isAtRisk ? "animate-pulse" : ""}`}
          >
            🔥
          </span>
          <div className="min-w-0">
            <div className="font-display font-black [font-stretch:116%] text-[19px] leading-tight truncate">
              {headline}
            </div>
            <p className="text-gris-fonce text-[12.5px] mt-0.5">{message}</p>
          </div>
        </div>

        {streakWeeks === 0 && (
          <Button size="sm" className="shrink-0" onClick={() => navigate("/matchs")}>
            Voir les matchs
          </Button>
        )}
      </div>

      <div className="flex gap-[4px] mt-4">
        {weeks.map((week) => (
          <span
            key={week.key}
            title={week.key}
            className={`flex-1 h-[6px] rounded-full ${week.logged ? "bg-projecteur" : "bg-nuit-haute border border-ligne"}`}
          />
        ))}
      </div>
    </Card>
  );
}
