import { Link } from "react-router";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { useBadges } from "../../hooks/useBadges";
import { BADGE_TRACK_ICONS } from "../badges/badgeIcons";

const PREVIEW_LIMIT = 6;

export function BadgesPreview() {
  const { isLoading, isError, badges, unlockedCount } = useBadges();

  if (isLoading || isError || badges.length === 0) return null;

  const unlocked = badges.filter((b) => b.unlocked).slice(-PREVIEW_LIMIT).reverse();

  return (
    <div className="mt-8">
      <h3 className="font-display font-bold text-[15px] mb-3">Tes badges</h3>
      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="chiffres font-display font-black [font-stretch:116%] text-[22px] text-projecteur leading-none">
              {unlockedCount}
              <span className="text-gris-fonce text-[14px]"> / {badges.length}</span>
            </div>
            {unlocked.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-2.5">
                {unlocked.map((badge) => {
                  const Icon = BADGE_TRACK_ICONS[badge.trackId];
                  return (
                    <div
                      key={badge.id}
                      title={badge.label}
                      className="ecusson ecusson-debloque w-8 h-8 grid place-items-center shrink-0"
                    >
                      {Icon && <Icon className="w-4 h-4 text-craie" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gris-fonce text-[12.5px] mt-1.5 max-w-[42ch]">
                Loggue tes premiers matchs pour débloquer tes premiers badges.
              </p>
            )}
          </div>
          <Link to="/badges" className="shrink-0">
            <Button variant="secondaire" size="sm">
              Voir tous mes badges
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
