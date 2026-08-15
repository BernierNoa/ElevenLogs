import { forwardRef, useState } from "react";
import { LedRatingBar } from "./LedRatingBar";
import { abbreviateTeamName } from "../lib/teamAbbreviation";
import { crestGradient } from "../lib/crestGradient";

export type ShareFormat = "story" | "post";

export interface ShareCardProps {
  format: ShareFormat;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  rating: number;
  motmName: string | null;
  comment: string | null;
  /** Identité de qui a loggé le match — story uniquement (le format post
   * reste inchangé). Absent tant que le profil n'a pas fini de charger :
   * le badge ne s'affiche simplement pas plutôt qu'un espace vide. */
  sharedByDisplayName?: string | null;
  sharedByAvatarUrl?: string | null;
}

const DIMENSIONS: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

const COMMENT_MAX_LENGTH = 160;
const STORY_COMMENT_MAX_LENGTH = 90;

function truncateComment(comment: string, maxLength: number): string {
  if (comment.length <= maxLength) return comment;
  return `${comment.slice(0, maxLength - 1).trimEnd()}…`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Toujours le dégradé + monogramme, jamais le vrai blason PronoGoat : ce
// serveur ne renvoie aucun en-tête CORS (vérifié en direct), donc
// html-to-image ne peut jamais lire les pixels de l'image pour l'intégrer à
// la capture — un <img> s'affiche très bien à l'écran mais ressort
// invisible (ou casse toute la capture sans imagePlaceholder) à l'export.
// Contrainte serveur tierce, pas contournable côté client.
function ShareCrest({ name, size }: { name: string; size: number }) {
  return (
    <span
      style={{ width: size, height: size, background: crestGradient(name) }}
      className="rounded-[28px] grid place-items-center font-data font-bold text-projecteur shrink-0"
    >
      <span style={{ fontSize: Math.round(size * 0.26) }}>{abbreviateTeamName(name)}</span>
    </span>
  );
}

function ShareAvatar({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="w-9 h-9 rounded-full grid place-items-center font-data text-[13px] font-bold text-projecteur shrink-0"
        style={{ background: "var(--color-pelouse)" }}
      >
        {initialsOf(name)}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      onError={() => setFailed(true)}
      className="w-9 h-9 rounded-full object-cover shrink-0"
    />
  );
}

// Rendu hors-écran (position fixed, hors du viewport) puis capturé en PNG par
// html-to-image — jamais affiché tel quel à l'utilisateur. Ne reçoit que des
// props explicites du log de l'utilisateur courant (cf. ShareLogButton) :
// aucune donnée d'un tiers ne transite par ce composant.
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  {
    format,
    competitionName,
    homeTeamName,
    awayTeamName,
    homeScore,
    awayScore,
    rating,
    motmName,
    comment,
    sharedByDisplayName,
    sharedByAvatarUrl,
  },
  ref,
) {
  const { width, height } = DIMENSIONS[format];
  const hasScore = homeScore !== null && awayScore !== null;
  const homeLeads = hasScore && (homeScore as number) > (awayScore as number);
  const awayLeads = hasScore && (awayScore as number) > (homeScore as number);

  if (format === "story") {
    return (
      <div
        ref={ref}
        style={{ width, height, background: "#0A0B0D" }}
        className="relative overflow-hidden text-craie"
      >
        {/* Lueur de projecteurs de stade — dégradé CSS pur (pas de filter/
         * backdrop-filter, peu fiables selon les navigateurs pour
         * html-to-image), assez discret pour ne jamais gêner le texte. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 820px 540px at 50% 44%, rgba(31,224,122,0.16), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col h-full px-14 py-16">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 bg-nuit-haute/70 border border-ligne rounded-full pl-2 pr-4 py-2 min-w-0">
              <span
                className="w-8 h-8 rounded-full shrink-0"
                style={{ background: "var(--color-pelouse)" }}
              />
              <span className="font-data text-[19px] tracking-[0.11em] uppercase text-projecteur truncate">
                {competitionName}
              </span>
            </div>

            {sharedByDisplayName && (
              <div className="flex items-center gap-2.5 bg-nuit-haute/70 border border-ligne rounded-full pl-2 pr-4 py-2 shrink-0 max-w-[300px]">
                {sharedByAvatarUrl ? (
                  <ShareAvatar url={sharedByAvatarUrl} name={sharedByDisplayName} />
                ) : (
                  <span
                    className="w-9 h-9 rounded-full grid place-items-center font-data text-[13px] font-bold text-projecteur shrink-0"
                    style={{ background: "var(--color-pelouse)" }}
                  >
                    {initialsOf(sharedByDisplayName)}
                  </span>
                )}
                <span className="text-[18px] font-semibold truncate">{sharedByDisplayName}</span>
              </div>
            )}
          </div>

          <div style={{ flex: 3 }} />

          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-4 w-[240px] min-w-0">
              <ShareCrest name={homeTeamName} size={172} />
              <span className="font-display font-bold [font-stretch:104%] text-[28px] text-center leading-tight truncate w-full">
                {homeTeamName}
              </span>
            </div>

            {hasScore ? (
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="chiffres font-display font-black [font-stretch:118%] text-[96px] leading-none"
                  style={{
                    color: homeLeads ? "var(--color-projecteur)" : "var(--color-craie)",
                    textShadow: homeLeads ? "0 0 44px rgba(31,224,122,0.55)" : undefined,
                  }}
                >
                  {homeScore}
                </span>
                <span className="text-[52px] font-black text-gris-fonce leading-none">:</span>
                <span
                  className="chiffres font-display font-black [font-stretch:118%] text-[96px] leading-none"
                  style={{
                    color: awayLeads ? "var(--color-projecteur)" : "var(--color-craie)",
                    textShadow: awayLeads ? "0 0 44px rgba(31,224,122,0.55)" : undefined,
                  }}
                >
                  {awayScore}
                </span>
              </div>
            ) : (
              <span className="font-data text-[24px] text-gris-fonce uppercase tracking-[0.1em] shrink-0">
                vs
              </span>
            )}

            <div className="flex flex-col items-center gap-4 w-[240px] min-w-0">
              <ShareCrest name={awayTeamName} size={172} />
              <span className="font-display font-bold [font-stretch:104%] text-[28px] text-center leading-tight truncate w-full">
                {awayTeamName}
              </span>
            </div>
          </div>

          <div style={{ flex: 1.3 }} />

          <div className="border border-ligne rounded-[28px] bg-nuit-haute/40 px-9 py-8">
            <LedRatingBar value={rating} size="normal" />

            {motmName && (
              <div className="badge badge-motm mt-6 !text-[19px] !px-5 !py-2.5">◆ {motmName}</div>
            )}

            {comment && (
              <p className="quote mt-6 !text-[21px]">
                {truncateComment(comment, STORY_COMMENT_MAX_LENGTH)}
              </p>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <div className="flex items-center justify-center gap-3">
            <span className="font-display font-black [font-stretch:120%] text-[32px] tracking-[-0.03em] uppercase">
              Eleven<span className="text-projecteur">Logs</span>
            </span>
            <span className="text-gris-fonce text-[20px]">·</span>
            <span className="font-data text-[17px] text-gris-fonce tracking-[0.06em]">
              elevenlogs.app
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{ width, height, background: "#0A0B0D" }}
      className="flex flex-col justify-between p-16 text-craie"
    >
      <div className="font-data text-[22px] tracking-[0.14em] uppercase text-projecteur">
        {competitionName}
      </div>

      <div className="text-center">
        <div className="font-display font-bold [font-stretch:104%] text-[46px] leading-tight">
          {homeTeamName}
        </div>
        {hasScore && (
          <div className="chiffres font-display font-black [font-stretch:118%] text-[88px] tracking-[-0.03em] my-4">
            {homeScore}
            <span className="text-gris-fonce mx-3 font-normal">–</span>
            {awayScore}
          </div>
        )}
        <div className="font-display font-bold [font-stretch:104%] text-[46px] leading-tight">
          {awayTeamName}
        </div>
      </div>

      <div>
        <LedRatingBar value={rating} size="normal" />

        {motmName && (
          <div className="badge badge-motm mt-6 !text-[18px] !px-4 !py-2">
            ◆ {motmName}
          </div>
        )}

        {comment && (
          <p className="quote mt-6 !text-[24px]">{truncateComment(comment, COMMENT_MAX_LENGTH)}</p>
        )}
      </div>

      <div className="text-center font-display font-black [font-stretch:120%] text-[32px] tracking-[-0.03em] uppercase">
        Eleven<span className="text-projecteur">Logs</span>
      </div>
    </div>
  );
});
