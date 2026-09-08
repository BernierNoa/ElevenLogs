import { forwardRef, useState } from "react";
import { LedRatingBar } from "./LedRatingBar";
import { abbreviateTeamName } from "../lib/teamAbbreviation";
import { crestGradient } from "../lib/crestGradient";
import { proxiedImageUrl } from "../lib/imageProxy";
import type { ShareFormat } from "./ShareCard";

export interface MultiplexShareMatch {
  id: string;
  /** Libellé de repli affiché si le match n'a pas de home/away structuré
   * (match personnalisé saisi librement, sans lien vers le référentiel). */
  label: string;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  homeTeamLogoUrl?: string | null;
  awayTeamLogoUrl?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

export interface MultiplexShareCardProps {
  format: ShareFormat;
  matches: MultiplexShareMatch[];
  rating: number;
  motmName: string | null;
  comment: string | null;
  sharedByDisplayName?: string | null;
  sharedByAvatarUrl?: string | null;
}

const DIMENSIONS: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

// Un multiplex peut compter jusqu'à 18 matchs (cf. MAX_MULTIPLEX_MATCHES) —
// bien trop pour tenir sur une story/un post sans les rendre illisibles. On
// n'affiche que les premiers, avec un total honnête ("+N autres matchs").
const MAX_ROWS: Record<ShareFormat, number> = { story: 6, post: 4 };

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

// Même repli que ShareCard.ShareCrest (blason via image-proxy, sinon
// dégradé + monogramme) mais en plus petit pour tenir sur une ligne de liste.
function MiniCrest({
  name,
  size,
  logoUrl,
}: {
  name: string;
  size: number;
  logoUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const proxied = proxiedImageUrl(logoUrl);

  if (proxied && !failed) {
    return (
      <span
        style={{ width: size, height: size, background: "var(--color-nuit-haute)" }}
        className="rounded-[14px] grid place-items-center shrink-0 p-1.5"
      >
        <img
          src={proxied}
          alt=""
          onError={() => setFailed(true)}
          className="w-full h-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      style={{ width: size, height: size, background: crestGradient(name) }}
      className="rounded-[14px] grid place-items-center font-data font-bold text-projecteur shrink-0"
    >
      <span style={{ fontSize: Math.round(size * 0.28) }}>{abbreviateTeamName(name)}</span>
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

function MatchRow({ match, crestSize }: { match: MultiplexShareMatch; crestSize: number }) {
  const hasTeams = !!match.homeTeamName && !!match.awayTeamName;
  const hasScore = match.homeScore != null && match.awayScore != null;

  if (!hasTeams) {
    return (
      <div className="flex items-center justify-center px-5 py-3 rounded-[16px] bg-nuit-haute/40 border border-ligne">
        <span className="font-display font-bold [font-stretch:104%] text-[19px] text-center truncate">
          {match.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-[16px] bg-nuit-haute/40 border border-ligne">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <MiniCrest name={match.homeTeamName!} size={crestSize} logoUrl={match.homeTeamLogoUrl} />
        <span className="font-display font-bold [font-stretch:104%] text-[17px] truncate">
          {match.homeTeamName}
        </span>
      </div>

      {hasScore ? (
        <span className="chiffres font-display font-black [font-stretch:118%] text-[22px] shrink-0 px-1">
          {match.homeScore}
          <span className="text-gris-fonce mx-1 font-normal">–</span>
          {match.awayScore}
        </span>
      ) : (
        <span className="font-data text-[13px] text-gris-fonce uppercase tracking-[0.08em] shrink-0 px-1">
          vs
        </span>
      )}

      <div className="flex flex-row-reverse items-center gap-2.5 flex-1 min-w-0 text-right">
        <MiniCrest name={match.awayTeamName!} size={crestSize} logoUrl={match.awayTeamLogoUrl} />
        <span className="font-display font-bold [font-stretch:104%] text-[17px] truncate">
          {match.awayTeamName}
        </span>
      </div>
    </div>
  );
}

// Pendant de ShareCard pour un multiplex (plusieurs matchs sous une seule
// note) : même mécanique de capture hors-écran via MultiplexShareExporter,
// mais le contenu central est une liste de matchs plutôt qu'un duel unique.
export const MultiplexShareCard = forwardRef<HTMLDivElement, MultiplexShareCardProps>(
  function MultiplexShareCard(
    { format, matches, rating, motmName, comment, sharedByDisplayName, sharedByAvatarUrl },
    ref,
  ) {
    const { width, height } = DIMENSIONS[format];
    const maxRows = MAX_ROWS[format];
    const visibleMatches = matches.slice(0, maxRows);
    const hiddenCount = matches.length - visibleMatches.length;

    if (format === "story") {
      return (
        <div
          ref={ref}
          style={{ width, height, background: "#0A0B0D" }}
          className="relative overflow-hidden text-craie"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 820px 540px at 50% 40%, rgba(31,224,122,0.16), transparent 70%)",
            }}
          />

          <div className="relative flex flex-col h-full px-14 py-16">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center bg-nuit-haute/70 border border-ligne rounded-full px-5 py-2 min-w-0">
                <span className="font-data text-[19px] tracking-[0.11em] uppercase text-projecteur truncate">
                  Multiplex · {matches.length}
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

            <div style={{ flex: 1 }} />

            <div className="flex flex-col gap-2.5">
              {visibleMatches.map((match) => (
                <MatchRow key={match.id} match={match} crestSize={52} />
              ))}
              {hiddenCount > 0 && (
                <p className="text-center font-data text-[15px] text-gris-fonce mt-1">
                  +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""} match{hiddenCount > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div style={{ flex: 1 }} />

            <div className="border border-ligne rounded-[28px] bg-nuit-haute/40 px-9 py-8">
              <LedRatingBar value={rating} size="normal" />

              {motmName && (
                <div className="badge badge-motm mt-6 !text-[19px] !px-5 !py-2.5">◆ {motmName}</div>
              )}

              {comment && (
                <div className="mt-6">
                  <p className="quote !text-[21px]">
                    {truncateComment(comment, STORY_COMMENT_MAX_LENGTH)}
                  </p>
                </div>
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
        className="flex flex-col justify-between p-14 text-craie"
      >
        <div className="font-data text-[22px] tracking-[0.14em] uppercase text-projecteur">
          Multiplex · {matches.length}
        </div>

        <div className="flex flex-col gap-2.5">
          {visibleMatches.map((match) => (
            <MatchRow key={match.id} match={match} crestSize={44} />
          ))}
          {hiddenCount > 0 && (
            <p className="text-center font-data text-[13px] text-gris-fonce mt-1">
              +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""} match{hiddenCount > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div>
          <LedRatingBar value={rating} size="normal" />

          {motmName && (
            <div className="badge badge-motm mt-6 !text-[18px] !px-4 !py-2">◆ {motmName}</div>
          )}

          {comment && (
            <div className="mt-6">
              <p className="quote !text-[24px]">{truncateComment(comment, COMMENT_MAX_LENGTH)}</p>
            </div>
          )}
        </div>

        <div className="text-center font-display font-black [font-stretch:120%] text-[32px] tracking-[-0.03em] uppercase">
          Eleven<span className="text-projecteur">Logs</span>
        </div>
      </div>
    );
  },
);
