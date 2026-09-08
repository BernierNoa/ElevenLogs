import { createPortal } from "react-dom";
import { useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { StatsShareExporter } from "./StatsShareExporter";
import { useProfileSettings } from "../hooks/useProfileSettings";
import type { useSeasonStats } from "../hooks/useSeasonStats";
import type { LogStreak } from "../hooks/useLogStreak";

export interface StatsShareModalProps {
  stats: ReturnType<typeof useSeasonStats>;
  streak?: LogStreak;
  onClose: () => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Visuel "récap de saison" prêt à publier, sur le même modèle que
// JournalShareModal (récap d'un match) : ouvert depuis la page Stats, capture
// les stats agrégées du compte connecté plutôt que le log d'un match précis.
export function StatsShareModal({ stats, streak, onClose }: StatsShareModalProps) {
  const { user } = useUser();
  const { data: myProfile } = useProfileSettings(user?.id);

  const displayName = myProfile?.display_name ?? user?.fullName ?? "Mon profil";
  const avatarUrl = myProfile?.avatar_url ?? user?.imageUrl ?? null;
  const topTeamName = stats.teamsByCount[0]?.label ?? null;

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
            Ma saison
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <StatsShareExporter
          filenameBase={slugify(displayName)}
          cardProps={{
            displayName,
            avatarUrl,
            matchsVus: stats.matchsVus,
            noteMoyenne: stats.noteMoyenne,
            totalGoals: stats.totalGoals,
            bestStreak: streak?.bestStreak ?? null,
            competitionPlusRegardee: stats.competitionPlusRegardee,
            topTeamName,
            jourPrefere: stats.jourPrefere,
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
