import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { showToast } from "../../lib/toastStore";

export interface InvitePanelProps {
  userId: string;
}

const canNativeShare =
  typeof navigator !== "undefined" &&
  typeof (navigator as Navigator & { share?: unknown }).share === "function";

// Le lien pointe directement sur le profil public (pas une page dédiée) :
// la personne invitée voit tout de suite qui l'invite avant de s'inscrire.
// ?invite=1 marque l'intention explicite d'invitation, pour ne déclencher
// l'auto-follow qu'à la réception de ce lien précis, pas sur n'importe quel
// partage de profil (ShareCard, recherche...) — cf. PendingInviteFollow.
function buildInviteUrl(userId: string): string {
  return `${window.location.origin}/u/${userId}?invite=1`;
}

export function InvitePanel({ userId }: InvitePanelProps) {
  const [isSharing, setIsSharing] = useState(false);
  const inviteUrl = buildInviteUrl(userId);

  async function handleShare() {
    if (canNativeShare) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: "Eleven Logs",
          text: "Rejoins-moi sur Eleven Logs pour noter les matchs qu'on regarde.",
          url: inviteUrl,
        });
      } catch {
        // AbortError si l'utilisateur ferme la feuille de partage — pas une
        // erreur à signaler.
      } finally {
        setIsSharing(false);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast("Lien d'invitation copié");
    } catch {
      showToast("Impossible de copier le lien");
    }
  }

  return (
    <div className="mt-8">
      <h3 className="font-display font-bold text-[15px] mb-3">Inviter des amis</h3>
      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="max-w-[52ch]">
            <div className="font-display font-bold text-[14px]">
              Ton lien d'invitation
            </div>
            <p className="text-gris-fonce text-[12.5px] mt-1">
              Un ami qui s'inscrit depuis ce lien te suit automatiquement — plus
              besoin de le rechercher après coup.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            onClick={handleShare}
            isLoading={isSharing}
          >
            {canNativeShare ? "Partager le lien" : "Copier le lien"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
