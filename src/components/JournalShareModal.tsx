import { createPortal } from "react-dom";
import { useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { ShareExporter } from "./ShareExporter";
import { useProfileSettings } from "../hooks/useProfileSettings";

export interface JournalShareModalProps {
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  rating: number;
  motmName: string | null;
  comment: string | null;
  competitionLogoUrl?: string | null;
  homeTeamLogoUrl?: string | null;
  awayTeamLogoUrl?: string | null;
  onClose: () => void;
}

function homeAwaySlug(home: string, away: string): string {
  return `${home}-${away}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Raccourci de partage direct depuis une carte du journal (cf.
// MatchCard.onShare) : même mécanique que ShareLogButton (dans
// LogMatchModal), mais sans repasser par la modale d'édition — les données
// du log sont déjà connues côté Journal, pas besoin de les re-saisir.
export function JournalShareModal({
  competitionName,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  rating,
  motmName,
  comment,
  competitionLogoUrl,
  homeTeamLogoUrl,
  awayTeamLogoUrl,
  onClose,
}: JournalShareModalProps) {
  const { user } = useUser();
  const { data: myProfile } = useProfileSettings(user?.id);

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
          <h2 className="font-display font-bold [font-stretch:104%] text-[18px]">
            {homeTeamName} – {awayTeamName}
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <ShareExporter
          filenameBase={homeAwaySlug(homeTeamName, awayTeamName)}
          cardProps={{
            competitionName,
            homeTeamName,
            awayTeamName,
            homeScore,
            awayScore,
            rating,
            motmName,
            comment,
            competitionLogoUrl,
            homeTeamLogoUrl,
            awayTeamLogoUrl,
            sharedByDisplayName: myProfile?.display_name,
            sharedByAvatarUrl: myProfile?.avatar_url,
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
