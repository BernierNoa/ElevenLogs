import { useState } from "react";
import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { TeamName } from "./TeamName";
import { LedRatingBar } from "./LedRatingBar";
import { CommentsModal } from "./CommentsModal";
import type { MatchStatus } from "../hooks/useMatches";
import type { LogItem } from "../hooks/useMyLogs";
import type { CommunityAverage } from "../hooks/useCommunityAverages";
import { formatKickoff, formatCountdown } from "../lib/formatDate";
import { abbreviateTeamName } from "../lib/teamAbbreviation";
import { crestGradient } from "../lib/crestGradient";

export interface MatchCardProps {
  competitionName: string;
  homeTeamName: string;
  homeTeamLogoUrl?: string | null;
  awayTeamName: string;
  awayTeamLogoUrl?: string | null;
  kickoffAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  myLog?: LogItem;
  onOpenLog?: () => void;
  /** Moyenne communautaire — n'est affichée que si le log existe déjà ET que
   * l'appelant a fourni une valeur (déjà filtrée à ≥ 3 logs publics en amont,
   * cf. useCommunityAverages). */
  communityAverage?: CommunityAverage;
  commentCount?: number;
  /** Vrai quand la carte affiche le log de quelqu'un d'autre (onglet Stats
   * d'un profil public) : masque "Modifier"/"Noter ce match", garde le
   * commentaire (modéré via logOwnerId, pas le compte du visiteur). */
  readOnly?: boolean;
  /** user_id propriétaire de myLog — sert de targetOwnerId pour la modale de
   * commentaires. Par défaut le compte connecté (Mon journal / Ta saison) ;
   * doit être fourni explicitement en readOnly pour ne pas donner à tort des
   * droits de modération au visiteur. */
  logOwnerId?: string;
  /** Compétition mise en avant (top 5 européen + Ligue des champions, cf.
   * lib/continents.isImportant) : rend le CTA "Noter ce match" plus visible
   * tant que le match n'est pas encore loggé. */
  important?: boolean;
  /** Ouvre le partage de story directement depuis la carte (cf. Journal),
   * sans repasser par la modale d'édition du log. Absent ailleurs (Matchs,
   * Accueil, Stats) où ce raccourci n'a pas de sens. */
  onShare?: () => void;
}

// Écart assumé avec la DA (qui bannit l'imagerie d'équipe) : les logo_url
// synchronisés depuis PronoGoat sont affichés. Repli sur le monogramme
// (pastille dégradée dérivée du nom, cf. lib/crestGradient) si l'URL est
// absente ou ne charge pas.
function Crest({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-9 h-9 rounded-lg shrink-0 object-contain bg-nuit-haute"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="w-9 h-9 rounded-lg shrink-0 grid place-items-center font-data text-[11px] font-bold text-projecteur"
      style={{ background: crestGradient(name) }}
    >
      {abbreviateTeamName(name)}
    </span>
  );
}

export function MatchCard({
  competitionName,
  homeTeamName,
  homeTeamLogoUrl,
  awayTeamName,
  awayTeamLogoUrl,
  kickoffAt,
  status,
  homeScore,
  awayScore,
  myLog,
  onOpenLog,
  communityAverage,
  commentCount = 0,
  readOnly = false,
  logOwnerId,
  important = false,
  onShare,
}: MatchCardProps) {
  const hasScore = homeScore !== null && awayScore !== null;
  const homeLeads = homeScore !== null && awayScore !== null && homeScore > awayScore;
  const awayLeads = homeScore !== null && awayScore !== null && awayScore > homeScore;
  const isLive = status === "live";
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [isCommenting, setIsCommenting] = useState(false);
  const commentTargetOwnerId = logOwnerId ?? user?.id;
  // Un log en attente de synchro n'a pas encore d'id serveur réel : rien à
  // commenter tant qu'il n'est pas confirmé (cf. LogItem.pending).
  const canComment = !!myLog && !myLog.pending;

  // Un match à venir ne peut pas encore être noté ; en direct ou terminé, si.
  const canLog = status !== "scheduled" && status !== "postponed";

  function handleLogClick() {
    if (!isSignedIn) {
      navigate("/connexion");
      return;
    }
    onOpenLog?.();
  }

  return (
    <Card logged={!!myLog} className={isLive ? "carte-live" : undefined}>
      <div className="flex items-center justify-between gap-2.5 mb-3.5">
        <span className="font-data text-[10.5px] text-gris-fonce uppercase tracking-[0.09em]">
          {formatKickoff(kickoffAt)}
        </span>
        {isLive ? (
          <Badge variant="live">En direct</Badge>
        ) : (
          <Badge variant="comp">{competitionName}</Badge>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Crest name={homeTeamName} logoUrl={homeTeamLogoUrl} />
          <TeamName
            name={homeTeamName}
            className="font-display font-bold [font-stretch:104%] text-[15px] tracking-[-0.01em]"
          />
        </div>

        {hasScore ? (
          <div
            className={[
              "chiffres font-display font-black [font-stretch:118%] text-[21px] tracking-[-0.03em] whitespace-nowrap rounded-full px-3 py-1 border",
              isLive ? "bg-pelouse/30 border-projecteur-fonce/50" : "bg-nuit-haute border-ligne",
            ].join(" ")}
          >
            <span className={homeLeads ? "text-projecteur" : undefined}>{homeScore}</span>
            <span className="text-gris-fonce mx-1 font-normal">–</span>
            <span className={awayLeads ? "text-projecteur" : undefined}>{awayScore}</span>
          </div>
        ) : (
          <div className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.08em]">
            vs
          </div>
        )}

        <div className="flex flex-row-reverse items-center gap-2.5 min-w-0 text-right">
          <Crest name={awayTeamName} logoUrl={awayTeamLogoUrl} />
          <TeamName
            name={awayTeamName}
            className="font-display font-bold [font-stretch:104%] text-[15px] tracking-[-0.01em] text-right"
          />
        </div>
      </div>

      {canLog && (
        <div className="mt-3.5 pt-3.5 border-t border-ligne flex items-center justify-between gap-3">
          {myLog ? (
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="logged">
                {myLog.pending ? (
                  <span title="En attente de synchronisation" aria-label="En attente de synchronisation">
                    ⏱
                  </span>
                ) : (
                  "✓"
                )}{" "}
                Loggé
              </Badge>
              <span className="w-20 shrink-0">
                <LedRatingBar value={myLog.rating} size="compact" showValue />
              </span>
              {canComment && (
                <button
                  type="button"
                  className="flex items-center gap-1 font-data text-[11px] tracking-[0.04em] text-gris-fonce hover:text-craie transition-colors shrink-0"
                  onClick={() => setIsCommenting(true)}
                >
                  <span aria-hidden="true">💬</span>
                  {commentCount > 0 ? commentCount : ""}
                </button>
              )}
            </div>
          ) : (
            <span />
          )}
          {!readOnly && (
            <div className="flex items-center gap-2 shrink-0">
              {myLog && !myLog.pending && onShare && (
                <Button
                  variant="discret"
                  size="sm"
                  iconOnly
                  aria-label="Partager en story"
                  onClick={onShare}
                >
                  📤
                </Button>
              )}
              <Button
                variant={myLog ? "secondaire" : "primaire"}
                size="sm"
                className={
                  important && !myLog ? "shadow-[0_0_14px_rgba(31,224,122,0.4)]" : undefined
                }
                onClick={handleLogClick}
              >
                {myLog ? "Modifier" : "Noter ce match"}
              </Button>
            </div>
          )}
        </div>
      )}

      {!canLog && (
        <div className="mt-3.5 pt-3.5 border-t border-ligne">
          {status === "postponed" ? (
            <span className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.08em]">
              Match reporté
            </span>
          ) : (
            <span className="font-data text-[11px] text-projecteur uppercase tracking-[0.08em]">
              Coup d'envoi {formatCountdown(kickoffAt)}
            </span>
          )}
        </div>
      )}

      {myLog && communityAverage && (
        <div className="mt-2.5 flex items-center gap-2">
          <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] shrink-0">
            {readOnly ? "Note" : "Toi"} {myLog.rating}
          </span>
          <span className="w-14 shrink-0">
            <LedRatingBar value={Math.round(communityAverage.average)} size="compact" />
          </span>
          <span className="chiffres font-data text-[10px] text-gris shrink-0">
            Communauté {communityAverage.average.toFixed(1)}
          </span>
        </div>
      )}

      {isCommenting && myLog && commentTargetOwnerId && (
        <CommentsModal
          target="log"
          targetId={myLog.id}
          targetOwnerId={commentTargetOwnerId}
          onClose={() => setIsCommenting(false)}
        />
      )}
    </Card>
  );
}
