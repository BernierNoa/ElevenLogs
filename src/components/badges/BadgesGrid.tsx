import type { BadgeProgress } from "../../hooks/useBadges";
import { BadgeCard } from "./BadgeCard";
import { BADGE_THEMES, type BadgeTheme } from "../../lib/badges";

const THEME_ORDER: BadgeTheme[] = ["progression", "diversite", "social", "implication"];

export interface BadgesGridProps {
  badges: BadgeProgress[];
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  return (
    <>
      {THEME_ORDER.map((theme) => {
        const themeBadges = badges.filter((b) => b.theme === theme);
        if (themeBadges.length === 0) return null;
        return (
          <div key={theme} className="mt-8">
            <div className="flex items-center gap-3.5 mb-3">
              <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
                {BADGE_THEMES[theme]}
              </h2>
              <span className="flex-1 h-px bg-ligne" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {themeBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
