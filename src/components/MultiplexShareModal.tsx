import { createPortal } from "react-dom";
import { useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { MultiplexShareExporter } from "./MultiplexShareExporter";
import type { MultiplexShareMatch } from "./MultiplexShareCard";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { useMatchesByIds } from "../hooks/useMatchesByIds";
import type { CustomLogItem } from "../hooks/useCustomLogs";

export interface MultiplexShareModalProps {
  customLog: CustomLogItem;
  onClose: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Pendant de JournalShareModal pour un multiplex/match personnalisé (cf.
// CustomLogCard.onShare) : mêmes rôles (récupérer le profil courant, ouvrir
// ShareExporter), mais doit d'abord réhydrater les blasons/scores des
// matchs du référentiel (custom_matches.match_id) — un match saisi
// librement n'a que son nom, affiché tel quel sans blason.
export function MultiplexShareModal({ customLog, onClose }: MultiplexShareModalProps) {
  const { user } = useUser();
  const { data: myProfile } = useProfileSettings(user?.id);

  const realMatchIds = customLog.matches
    .map((m) => m.matchId)
    .filter((id): id is string => !!id);
  const { data: realMatches } = useMatchesByIds(realMatchIds);
  const realMatchesById = new Map((realMatches ?? []).map((m) => [m.id, m]));

  const matches: MultiplexShareMatch[] = customLog.matches.map((m) => {
    const real = m.matchId ? realMatchesById.get(m.matchId) : undefined;
    return {
      id: m.id,
      label: m.name,
      homeTeamName: real?.home_team?.name ?? null,
      awayTeamName: real?.away_team?.name ?? null,
      homeTeamLogoUrl: real?.home_team?.logo_url ?? null,
      awayTeamLogoUrl: real?.away_team?.logo_url ?? null,
      homeScore: real?.home_score ?? null,
      awayScore: real?.away_score ?? null,
    };
  });

  const isMultiplex = customLog.matches.length > 1;
  const title = isMultiplex ? `Multiplex · ${customLog.matches.length}` : customLog.matches[0]?.name;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-bold [font-stretch:104%] text-[18px] truncate">
            {title}
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <MultiplexShareExporter
          filenameBase={
            isMultiplex ? `multiplex-${customLog.matches.length}` : slugify(customLog.matches[0]?.name ?? "match")
          }
          cardProps={{
            matches,
            rating: customLog.rating,
            motmName: customLog.motmName,
            comment: customLog.comment,
            sharedByDisplayName: myProfile?.display_name,
            sharedByAvatarUrl: myProfile?.avatar_url,
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
