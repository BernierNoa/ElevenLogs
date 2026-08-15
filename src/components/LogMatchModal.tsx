import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { LedRatingBar } from "./LedRatingBar";
import { ShareLogButton } from "./ShareLogButton";
import { useMatchLineup, type LineupPlayerItem } from "../hooks/useMatchLineup";
import { useSaveLog } from "../hooks/useSaveLog";
import { useDeleteLog } from "../hooks/useDeleteLog";
import type { LogItem } from "../hooks/useMyLogs";

export interface LogMatchModalProps {
  onClose: () => void;
  matchId: string;
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  homeScore?: number | null;
  awayScore?: number | null;
  existingLog?: LogItem;
}

export function LogMatchModal({
  onClose,
  matchId,
  competitionName,
  homeTeamName,
  awayTeamName,
  kickoffAt,
  homeScore = null,
  awayScore = null,
  existingLog,
}: LogMatchModalProps) {
  const initialRating = existingLog?.rating ?? null;
  const initialMotmPlayerId = existingLog?.motm_player_id ?? null;
  const initialComment = existingLog?.comment ?? "";
  const initialWatchedAt = (existingLog?.watched_at ?? kickoffAt).slice(0, 10);

  const [rating, setRating] = useState<number | null>(initialRating);
  const [motmPlayerId, setMotmPlayerId] = useState<string | null>(initialMotmPlayerId);
  const [comment, setComment] = useState(initialComment);
  const [watchedAt, setWatchedAt] = useState(initialWatchedAt);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const minWatchedAt = kickoffAt.slice(0, 10);
  const maxWatchedAt = new Date().toISOString().slice(0, 10);

  const { data: lineup, isLoading: isLineupLoading } = useMatchLineup(matchId);
  const saveLog = useSaveLog();
  const deleteLog = useDeleteLog();

  const groups = new Map<string, { teamName: string; players: LineupPlayerItem[] }>();
  for (const player of lineup ?? []) {
    const group = groups.get(player.teamId);
    if (group) group.players.push(player);
    else groups.set(player.teamId, { teamName: player.teamName, players: [player] });
  }

  const motmName =
    (lineup ?? []).find((p) => p.playerId === motmPlayerId)?.fullName ?? null;

  async function handleSave() {
    if (rating === null) return;
    try {
      await saveLog.mutateAsync({
        matchId,
        rating,
        motmPlayerId,
        comment: comment.trim() || null,
        watchedAt,
      });
      onClose();
    } catch {
      // Échec réel (pas une simple coupure réseau, déjà mise en queue par le
      // hook) : la modale reste ouverte, saveLog.isError pilote le bandeau
      // d'erreur ci-dessous.
    }
  }

  async function handleDelete() {
    if (!existingLog) return;
    await deleteLog.mutateAsync(existingLog.id);
    onClose();
  }

  const isDirty =
    rating !== initialRating ||
    motmPlayerId !== initialMotmPlayerId ||
    comment.trim() !== initialComment.trim() ||
    watchedAt !== initialWatchedAt;

  function handleRequestClose() {
    if (isDirty) setConfirmingClose(true);
    else onClose();
  }

  // Portée dans document.body : un ancêtre avec backdrop-blur/filter/transform
  // (ex. la barre de recherche sticky) crée un containing block pour les
  // éléments `fixed`, ce qui piègerait sinon la modale dans ses limites au
  // lieu de couvrir tout l'écran.
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={handleRequestClose}
    >
      <div
        className="carte w-full sm:max-w-[640px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée décorative — affordance bottom-sheet, mobile uniquement. */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        {confirmingClose ? (
          <div className="py-6 text-center">
            <p className="text-craie text-[15px] mb-5">
              Fermer sans enregistrer ? Ta note et tes modifications seront perdus.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="discret" onClick={() => setConfirmingClose(false)}>
                Continuer à éditer
              </Button>
              <Button variant="destructif" onClick={onClose}>
                Fermer sans enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <span className="badge badge-comp">{competitionName}</span>
            <h2 className="font-display font-bold [font-stretch:104%] text-[18px] mt-2.5">
              {homeTeamName} – {awayTeamName}
            </h2>
          </div>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={handleRequestClose}>
            ✕
          </Button>
        </div>

        <div className="mb-6">
          <label className="champ-label">
            Ta note <span className="text-projecteur normal-case">— obligatoire</span>
          </label>
          <LedRatingBar value={rating} onChange={setRating} />
        </div>

        <div className="mb-6">
          <label htmlFor="log-watched-at" className="champ-label">
            Date de visionnage{" "}
            <span className="text-gris-fonce normal-case">
              — facultatif, utile en cas de rattrapage
            </span>
          </label>
          <input
            id="log-watched-at"
            type="date"
            className="champ-input max-w-[180px]"
            value={watchedAt}
            min={minWatchedAt}
            max={maxWatchedAt}
            onChange={(e) => e.target.value && setWatchedAt(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="champ-label">
            Homme du match — joueurs du match{" "}
            <span className="text-gris-fonce normal-case">— facultatif</span>
          </label>
          {!isLineupLoading && groups.size === 0 && (
            <p className="text-gris-fonce text-[13px]">
              Homme du match indisponible pour ce match — PronoGoat n'a pas
              fourni de composition.
            </p>
          )}
          {[...groups.entries()].map(([teamId, group]) => (
            <div key={teamId} className="mb-3">
              <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] mb-1.5">
                {group.teamName}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {group.players.map((player) => {
                  const selected = motmPlayerId === player.playerId;
                  return (
                    <button
                      key={player.playerId}
                      type="button"
                      onClick={() =>
                        setMotmPlayerId(selected ? null : player.playerId)
                      }
                      className={[
                        "flex items-center gap-2 px-2.5 py-2 rounded-md border text-left transition-colors",
                        selected
                          ? "border-motm-gold bg-motm-gold/10"
                          : "border-ligne bg-nuit hover:border-gris-fonce",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-[13.5px] font-semibold truncate",
                          selected ? "text-motm-gold" : "text-craie",
                        ].join(" ")}
                      >
                        {player.fullName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Textarea
          label="Commentaire"
          helper="Toujours facultatif."
          placeholder="Ce que tu retiendras de ce match…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {existingLog && rating !== null && (
          <div className="mb-6">
            <label className="champ-label">Partager</label>
            <ShareLogButton
              competitionName={competitionName}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
              homeScore={homeScore}
              awayScore={awayScore}
              rating={rating}
              motmName={motmName}
              comment={comment.trim() || null}
            />
          </div>
        )}

        {saveLog.isError && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-carton/40 bg-carton/10 px-3.5 py-2.5"
          >
            <p className="text-carton text-[13px]">
              Échec de l'enregistrement. Réessaie.
            </p>
            <Button
              variant="secondaire"
              size="sm"
              onClick={handleSave}
              isLoading={saveLog.isPending}
            >
              Réessayer
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-6">
          {existingLog ? (
            confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] text-gris-fonce">Confirmer ?</span>
                <Button
                  variant="destructif"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={deleteLog.isPending}
                >
                  Oui, supprimer
                </Button>
                <Button
                  variant="discret"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <Button variant="destructif" onClick={() => setConfirmingDelete(true)}>
                Supprimer ce log
              </Button>
            )
          ) : (
            <span />
          )}
          <Button
            onClick={handleSave}
            disabled={rating === null}
            isLoading={saveLog.isPending}
          >
            Enregistrer le log
          </Button>
        </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
