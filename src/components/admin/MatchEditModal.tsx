import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/Button";
import { useAdminMatchActions } from "../../hooks/useAdminMatchActions";
import { showToast } from "../../lib/toastStore";
import type { AdminMatchItem } from "../../hooks/useAdminMatches";

export interface MatchEditModalProps {
  match: AdminMatchItem;
  onClose: () => void;
}

// Corrige le nom d'une équipe (typo de scraping) — la modification porte sur
// `teams.name`, donc s'applique à tous les matchs de cette équipe, pas
// seulement celui-ci : comportement voulu, une équipe n'a qu'un seul nom.
export function MatchEditModal({ match, onClose }: MatchEditModalProps) {
  const [homeName, setHomeName] = useState(match.home_team?.name ?? "");
  const [awayName, setAwayName] = useState(match.away_team?.name ?? "");
  const { renameTeam } = useAdminMatchActions();

  const homeChanged = homeName.trim() !== (match.home_team?.name ?? "") && homeName.trim().length > 0;
  const awayChanged = awayName.trim() !== (match.away_team?.name ?? "") && awayName.trim().length > 0;

  function handleSave() {
    if (homeChanged && match.home_team) {
      renameTeam.mutate({ teamId: match.home_team.id, name: homeName.trim() });
    }
    if (awayChanged && match.away_team) {
      renameTeam.mutate({ teamId: match.away_team.id, name: awayName.trim() });
    }
    showToast("Équipe(s) mise(s) à jour.");
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[420px] rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-bold [font-stretch:104%] text-[16px]">
            Corriger les équipes
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="champ-label" htmlFor="home-team-name">
              Équipe à domicile
            </label>
            <input
              id="home-team-name"
              type="text"
              className="champ-input"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
            />
          </div>
          <div>
            <label className="champ-label" htmlFor="away-team-name">
              Équipe à l'extérieur
            </label>
            <input
              id="away-team-name"
              type="text"
              className="champ-input"
              value={awayName}
              onChange={(e) => setAwayName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="discret" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!homeChanged && !awayChanged}
            isLoading={renameTeam.isPending}
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
