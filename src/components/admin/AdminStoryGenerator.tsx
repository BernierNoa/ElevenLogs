import { createPortal } from "react-dom";
import { Button } from "../ui/Button";
import { ShareExporter } from "../ShareExporter";
import { useAdminMatchCommunityStory } from "../../hooks/useAdminMatchCommunityStory";
import type { AdminMatchItem } from "../../hooks/useAdminMatches";

export interface AdminStoryGeneratorProps {
  match: AdminMatchItem;
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

// Récap communautaire d'un match, prêt à publier — même mécanique de
// capture/téléchargement que ShareLogButton (via ShareExporter), mais le
// contenu vient de useAdminMatchCommunityStory (moyenne, MVP le plus élu,
// commentaire le plus aimé) plutôt que du log d'un seul utilisateur.
export function AdminStoryGenerator({ match, onClose }: AdminStoryGeneratorProps) {
  const story = useAdminMatchCommunityStory(match.id);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[520px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <span className="badge badge-comp">{match.competition?.name ?? ""}</span>
            <h2 className="font-display font-bold [font-stretch:104%] text-[18px] mt-2.5">
              {match.home_team?.name ?? "?"} – {match.away_team?.name ?? "?"}
            </h2>
          </div>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        {story.isLoading ? (
          <p className="text-gris-fonce text-[13px]">Chargement…</p>
        ) : story.isError ? (
          <div>
            <p className="text-carton text-[13px] mb-3">Impossible de charger les avis de ce match.</p>
            <Button variant="secondaire" size="sm" onClick={() => story.refetch()}>
              Réessayer
            </Button>
          </div>
        ) : !story.data || story.data.reviewCount === 0 ? (
          <p className="text-gris-fonce text-[13px]">
            Personne n'a encore loggé ce match — pas assez de matière pour une story.
          </p>
        ) : (
          <>
            <p className="text-gris-fonce text-[12.5px] mb-4">
              {story.data.reviewCount} avis · note moyenne {story.data.averageRating!.toFixed(1)}
              {story.data.topMotmName && ` · MVP le plus élu : ${story.data.topMotmName}`}
            </p>
            <ShareExporter
              filenameBase={`communaute-${homeAwaySlug(
                match.home_team?.name ?? "equipe1",
                match.away_team?.name ?? "equipe2",
              )}`}
              cardProps={{
                competitionName: match.competition?.name ?? "",
                homeTeamName: match.home_team?.name ?? "?",
                awayTeamName: match.away_team?.name ?? "?",
                homeScore: match.home_score,
                awayScore: match.away_score,
                rating: story.data.averageRating!,
                motmName: story.data.topMotmName,
                comment: story.data.topComment?.body ?? null,
                commentAuthorName: story.data.topComment?.authorName ?? null,
                reviewCount: story.data.reviewCount,
                competitionLogoUrl: match.competition?.logo_url,
                homeTeamLogoUrl: match.home_team?.logo_url,
                awayTeamLogoUrl: match.away_team?.logo_url,
              }}
            />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
