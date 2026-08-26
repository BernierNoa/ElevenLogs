import { useUser } from "@clerk/react-router";
import { ShareExporter } from "./ShareExporter";
import { useProfileSettings } from "../hooks/useProfileSettings";

export interface ShareLogButtonProps {
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
}

function homeAwaySlug(home: string, away: string): string {
  return `${home}-${away}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Uniquement pour le log de l'utilisateur courant : les props viennent
// toujours de l'état local de LogMatchModal (jamais d'un tiers). Wrapper fin
// autour de ShareExporter (mécanique de capture/téléchargement/partage
// partagée avec AdminStoryGenerator) : n'ajoute que l'identité de qui logge.
export function ShareLogButton(props: ShareLogButtonProps) {
  const { user } = useUser();
  const { data: myProfile } = useProfileSettings(user?.id);

  return (
    <ShareExporter
      filenameBase={homeAwaySlug(props.homeTeamName, props.awayTeamName)}
      cardProps={{
        ...props,
        sharedByDisplayName: myProfile?.display_name,
        sharedByAvatarUrl: myProfile?.avatar_url,
      }}
    />
  );
}
