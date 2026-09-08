import { forwardRef } from "react";
import type { ShareFormat } from "./ShareCard";

export interface StatsShareCardProps {
  format: ShareFormat;
  displayName: string;
  avatarUrl?: string | null;
  matchsVus: number;
  noteMoyenne: number | null;
  totalGoals: number;
  bestStreak: number | null;
  competitionPlusRegardee: string | null;
  topTeamName: string | null;
  jourPrefere: string | null;
}

const DIMENSIONS: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

// Avatar Clerk (images.clerk.dev) chargé directement, comme sharedByAvatarUrl
// dans ShareCard : contrairement aux blasons PronoGoat, ces images renvoient
// des en-têtes CORS ouverts, donc html-to-image peut les lire sans passer par
// image-proxy (cf. lib/imageProxy.ts).
function StatsAvatar({
  url,
  name,
  size,
}: {
  url?: string | null;
  name: string;
  size: number;
}) {
  const borderStyle = { borderColor: "var(--color-projecteur)" };

  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{ width: size, height: size, ...borderStyle }}
        className="rounded-full object-cover shrink-0 border-4"
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, background: "var(--color-pelouse)", ...borderStyle }}
      className="rounded-full grid place-items-center font-data font-bold text-projecteur shrink-0 border-4"
    >
      <span style={{ fontSize: Math.round(size * 0.32) }}>{initialsOf(name)}</span>
    </span>
  );
}

function StatBlock({
  value,
  label,
  big = false,
}: {
  value: string;
  label: string;
  big?: boolean;
}) {
  return (
    <div className="border border-ligne rounded-[24px] bg-nuit-haute/40 px-7 py-7 text-center min-w-0">
      <div
        className="chiffres font-display font-black [font-stretch:116%] text-projecteur leading-none truncate"
        style={{ fontSize: big ? 64 : 48 }}
      >
        {value}
      </div>
      <div className="font-data text-[14px] text-gris-fonce uppercase tracking-[0.09em] mt-3 truncate">
        {label}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ligne py-4 last:border-b-0">
      <span className="font-data text-[16px] text-gris-fonce uppercase tracking-[0.08em]">
        {label}
      </span>
      <span className="font-display font-bold [font-stretch:104%] text-[22px] text-craie text-right truncate max-w-[560px]">
        {value}
      </span>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="font-display font-black [font-stretch:120%] text-[32px] tracking-[-0.03em] uppercase text-craie">
        Eleven<span className="text-projecteur">Logs</span>
      </span>
      <span className="text-gris-fonce text-[20px]">·</span>
      <span className="font-data text-[17px] text-gris-fonce tracking-[0.06em]">
        elevenlogs.app
      </span>
    </div>
  );
}

// Rendu hors-écran (cf. StatsShareExporter) puis capturé en PNG par
// html-to-image, même mécanique visuelle que ShareCard (le récap de match) :
// fond nuit + lueur projecteur, wordmark en pied de page. Uniquement des
// stats agrégées de l'utilisateur courant, jamais de données d'un tiers.
export const StatsShareCard = forwardRef<HTMLDivElement, StatsShareCardProps>(
  function StatsShareCard(
    {
      format,
      displayName,
      avatarUrl,
      matchsVus,
      noteMoyenne,
      totalGoals,
      bestStreak,
      competitionPlusRegardee,
      topTeamName,
      jourPrefere,
    },
    ref,
  ) {
    const { width, height } = DIMENSIONS[format];

    const infoRows = [
      competitionPlusRegardee && { label: "Compétition favorite", value: competitionPlusRegardee },
      topTeamName && { label: "Équipe la plus vue", value: topTeamName },
      jourPrefere && { label: "Jour préféré", value: capitalize(jourPrefere) },
    ].filter((r): r is { label: string; value: string } => !!r);

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
                "radial-gradient(ellipse 820px 540px at 50% 38%, rgba(31,224,122,0.16), transparent 70%)",
            }}
          />

          <div className="relative flex flex-col h-full px-14 py-16">
            <div className="flex justify-center">
              <span className="font-data text-[19px] tracking-[0.14em] uppercase text-projecteur bg-nuit-haute/70 border border-ligne rounded-full px-6 py-2.5">
                Ma saison
              </span>
            </div>

            <div style={{ flex: 1 }} />

            <div className="flex flex-col items-center gap-5">
              <StatsAvatar url={avatarUrl} name={displayName} size={168} />
              <span className="font-display font-bold [font-stretch:104%] text-[32px] text-center truncate max-w-full">
                {displayName}
              </span>
            </div>

            <div style={{ flex: 0.6 }} />

            <div className="text-center">
              <div className="chiffres font-display font-black [font-stretch:120%] text-[168px] leading-none text-projecteur" style={{ textShadow: "0 0 60px rgba(31,224,122,0.5)" }}>
                {matchsVus}
              </div>
              <div className="font-data text-[20px] text-gris-fonce uppercase tracking-[0.14em] mt-3">
                Matchs loggués
              </div>
            </div>

            <div style={{ flex: 0.8 }} />

            <div className="grid grid-cols-3 gap-3">
              <StatBlock value={noteMoyenne !== null ? noteMoyenne.toFixed(1) : "–"} label="Note moy." />
              <StatBlock value={String(totalGoals)} label="Buts vus" />
              <StatBlock value={bestStreak !== null && bestStreak > 0 ? `${bestStreak}j` : "–"} label="Meilleure série" />
            </div>

            {infoRows.length > 0 && (
              <div className="border border-ligne rounded-[24px] bg-nuit-haute/40 px-8 mt-6">
                {infoRows.map((row) => (
                  <InfoPill key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            )}

            <div style={{ flex: 1 }} />

            <Wordmark />
          </div>
        </div>
      );
    }

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
              "radial-gradient(ellipse 700px 460px at 50% 34%, rgba(31,224,122,0.16), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col h-full px-14 py-12">
          <div className="flex justify-center">
            <span className="font-data text-[16px] tracking-[0.14em] uppercase text-projecteur bg-nuit-haute/70 border border-ligne rounded-full px-5 py-2">
              Ma saison
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <StatsAvatar url={avatarUrl} name={displayName} size={72} />
            <span className="font-display font-bold [font-stretch:104%] text-[26px] truncate max-w-[560px]">
              {displayName}
            </span>
          </div>

          <div className="text-center mt-6">
            <div className="chiffres font-display font-black [font-stretch:120%] text-[104px] leading-none text-projecteur" style={{ textShadow: "0 0 60px rgba(31,224,122,0.5)" }}>
              {matchsVus}
            </div>
            <div className="font-data text-[16px] text-gris-fonce uppercase tracking-[0.14em] mt-2">
              Matchs loggués
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-7">
            <StatBlock value={noteMoyenne !== null ? noteMoyenne.toFixed(1) : "–"} label="Note moy." />
            <StatBlock value={String(totalGoals)} label="Buts vus" />
            <StatBlock value={bestStreak !== null && bestStreak > 0 ? `${bestStreak}j` : "–"} label="Meilleure série" />
          </div>

          {infoRows.length > 0 && (
            <div className="border border-ligne rounded-[20px] bg-nuit-haute/40 px-7 mt-6">
              {infoRows.map((row) => (
                <InfoPill key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          <Wordmark />
        </div>
      </div>
    );
  },
);
