import type { BadgeProgress } from "../../hooks/useBadges";
import { BADGE_TRACK_ICONS, IconLock } from "./badgeIcons";

export interface BadgeCardProps {
  badge: BadgeProgress;
}

function formatUnlockedAt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const Icon = BADGE_TRACK_ICONS[badge.trackId];
  const span = badge.threshold - badge.prevThreshold;
  const progressRatio =
    span > 0
      ? Math.min(1, Math.max(0, (badge.current - badge.prevThreshold) / span))
      : 0;

  return (
    <div className={["carte p-4 flex flex-col items-center text-center gap-2.5", badge.unlocked ? "" : "opacity-90"].join(" ")}>
      <div
        className={[
          "ecusson relative w-16 h-16 shrink-0 grid place-items-center",
          badge.unlocked ? "ecusson-debloque" : "ecusson-verrouille",
        ].join(" ")}
      >
        {Icon && (
          <Icon
            className={["w-7 h-7", badge.unlocked ? "text-craie" : "text-gris-fonce"].join(" ")}
          />
        )}
        {!badge.unlocked && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-nuit border border-ligne grid place-items-center">
            <IconLock className="w-2.5 h-2.5 text-gris-fonce" />
          </span>
        )}
      </div>

      <div className="font-display font-bold text-[13px] leading-tight">{badge.label}</div>
      <p className="text-gris-fonce text-[11.5px] leading-snug">{badge.description}</p>

      {badge.unlocked ? (
        <div className="font-data text-[9.5px] text-projecteur uppercase tracking-[0.08em] mt-0.5">
          {badge.unlockedAt ? `Débloqué le ${formatUnlockedAt(badge.unlockedAt)}` : "Débloqué"}
        </div>
      ) : (
        <div className="w-full mt-0.5">
          <div className="h-1.5 rounded-full bg-ligne overflow-hidden">
            <div
              className="h-full rounded-full bg-projecteur-fonce"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
          <div className="chiffres font-data text-[9.5px] text-gris-fonce mt-1">
            {Math.min(badge.current, badge.threshold)} / {badge.threshold}
          </div>
        </div>
      )}
    </div>
  );
}
