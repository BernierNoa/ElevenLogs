import type { BadgeProgress } from "../../hooks/useBadges";
import { BADGE_TRACK_ICONS } from "./badgeIcons";

const TRACK_LABELS: Record<string, string> = {
  volume: "Volume",
  streak: "Série",
  continents: "Continents",
  competitions: "Compétitions",
  teams: "Équipes",
  followers: "Abonnés",
  following: "Abonnements",
  motm: "MOTM",
  comments: "Commentaires",
  multiplex: "Multiplex",
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function BadgesTracks({ badges }: { badges: BadgeProgress[] }) {
  const trackIds = Array.from(new Set(badges.map((b) => b.trackId)));

  // Ordre stable (préférences UX plutôt qu'ordre arbitraire par Set)
  const ORDER = [
    "volume",
    "streak",
    "continents",
    "competitions",
    "teams",
    "followers",
    "following",
    "motm",
    "comments",
    "multiplex",
  ];

  const orderedTrackIds = [
    ...ORDER.filter((id) => trackIds.includes(id)),
    ...trackIds.filter((id) => !ORDER.includes(id)),
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3.5 mb-3">
        <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
          Progression détaillée
        </h2>
        <span className="flex-1 h-px bg-ligne" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orderedTrackIds.map((trackId) => {
          const trackBadges = badges
            .filter((b) => b.trackId === trackId)
            .slice()
            .sort((a, b) => a.threshold - b.threshold);

          const current = trackBadges[0]?.current ?? 0;
          const unlockedBadges = trackBadges.filter((b) => b.unlocked);
          const lastUnlocked = unlockedBadges.at(-1) ?? null;
          const nextBadge = trackBadges.find((b) => !b.unlocked) ?? null;

          const Icon = BADGE_TRACK_ICONS[trackId];

          const progressRatio = nextBadge
            ? clamp01(
                (current - nextBadge.prevThreshold) /
                  Math.max(1, nextBadge.threshold - nextBadge.prevThreshold),
              )
            : 1;

          return (
            <div key={trackId} className="carte p-4">
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "w-10 h-10 rounded-xl grid place-items-center",
                    "bg-projecteur/10 border border-projecteur-fonce/50",
                  ].join(" ")}
                >
                  {Icon ? <Icon className="w-5 h-5 text-projecteur" /> : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display font-bold text-[14px] truncate">
                      {TRACK_LABELS[trackId] ?? trackId}
                    </div>
                    <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] shrink-0">
                      {nextBadge
                        ? `${Math.floor(current)} / ${nextBadge.threshold}`
                        : "Terminé"}
                    </div>
                  </div>

                  {nextBadge ? (
                    <p className="text-gris-fonce text-[12px] mt-2 leading-snug">
                      Critère : {nextBadge.description}
                    </p>
                  ) : lastUnlocked ? (
                    <p className="text-gris-fonce text-[12px] mt-2 leading-snug">
                      Dernier badge : {lastUnlocked.label}
                    </p>
                  ) : (
                    <p className="text-gris-fonce text-[12px] mt-2 leading-snug">
                      —
                    </p>
                  )}

                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-ligne overflow-hidden">
                      <div
                        className="h-full rounded-full bg-projecteur"
                        style={{ width: `${progressRatio * 100}%` }}
                      />
                    </div>
                    <div className="chiffres font-data text-[10.5px] text-gris-fonce mt-2">
                      {nextBadge
                        ? `Progression vers “${nextBadge.label}”`
                        : "Collection complète"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-gris-fonce text-[12px] mt-4">
        Astuce : les badges se débloquent automatiquement dès que tes compteurs
        atteignent les seuils.
      </p>
    </div>
  );
}
