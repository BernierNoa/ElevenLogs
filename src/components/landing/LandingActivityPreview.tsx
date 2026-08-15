import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { LedRatingBar } from "../LedRatingBar";
import { MOCK_ACTIVITY } from "./mockActivity";

export function LandingActivityPreview() {
  return (
    <section className="max-w-[1180px] mx-auto px-5 md:px-8 py-14 md:py-20 border-t border-ligne">
      <span className="font-data text-[11px] tracking-[0.14em] uppercase text-projecteur">
        Ça bouge en ce moment
      </span>
      <h2 className="font-display font-extrabold [font-stretch:110%] text-[24px] md:text-[30px] leading-[1.1] tracking-[-0.02em] mt-2 max-w-[26ch]">
        Tu n'es pas seul à regarder ce soir.
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 mt-8">
        {MOCK_ACTIVITY.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between gap-2.5 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full bg-nuit-haute shrink-0" aria-hidden="true" />
                <span className="text-[13.5px] font-semibold truncate">{item.displayName}</span>
              </div>
              <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] shrink-0">
                {item.relativeTime}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 mb-2">
              <Badge variant="comp">{item.competitionName}</Badge>
            </div>

            <div className="font-display font-bold [font-stretch:104%] text-[14.5px] mb-3">
              {item.homeTeamName}
              <span className="chiffres text-gris-fonce mx-1.5">
                {item.homeScore}–{item.awayScore}
              </span>
              {item.awayTeamName}
            </div>

            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0">
                <LedRatingBar value={item.rating} size="compact" showValue />
              </span>
              {item.motmName && <Badge variant="motm">◆ {item.motmName}</Badge>}
            </div>

            {item.comment && <p className="quote mt-3">{item.comment}</p>}
          </Card>
        ))}
      </div>

      <p className="text-gris-fonce text-[12.5px] text-center mt-6">
        Et des dizaines d'autres logs chaque semaine.
      </p>
    </section>
  );
}
