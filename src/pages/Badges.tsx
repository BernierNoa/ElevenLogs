import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { BadgeCard } from "../components/badges/BadgeCard";
import { useBadges } from "../hooks/useBadges";
import { BADGE_THEMES, type BadgeTheme } from "../lib/badges";

const THEME_ORDER: BadgeTheme[] = ["progression", "diversite", "social", "implication"];

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
          <div className="carte p-5 mt-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="chiffres font-display font-black [font-stretch:116%] text-[30px] text-projecteur leading-none">
                {unlockedCount}
                <span className="text-gris-fonce text-[18px]"> / {badges.length}</span>
              </div>
              <p className="text-gris-fonce text-[12.5px] mt-1.5">badges débloqués</p>
            </div>
            <div className="h-2 rounded-full bg-ligne overflow-hidden flex-1 min-w-[140px] max-w-[280px]">
              <div
                className="h-full rounded-full bg-projecteur"
                style={{ width: `${badges.length > 0 ? (unlockedCount / badges.length) * 100 : 0}%` }}
              />
            </div>
          </div>

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
      )}
    </div>
  );
}
