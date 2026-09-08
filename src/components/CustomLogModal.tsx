import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { LedRatingBar } from "./LedRatingBar";
import { MultiplexMatchPicker } from "./MultiplexMatchPicker";
import { useSaveCustomLog } from "../hooks/useSaveCustomLog";
import { useDeleteCustomLog } from "../hooks/useDeleteCustomLog";
import { useMatchesByIds } from "../hooks/useMatchesByIds";
import { useLineupsForMatches } from "../hooks/useLineupsForMatches";
import type { CustomLogItem } from "../hooks/useCustomLogs";
import type { MatchListItem } from "../hooks/useMatches";

export interface CustomLogModalProps {
  onClose: () => void;
  /** Nombre de lignes de matchs pré-remplies à la création. Sans effet en édition. */
  mode: "single" | "multiplex";
  existingCustomLog?: CustomLogItem;
}

interface MatchRow {
  name: string;
  kickoffAt: string;
}

const MAX_FREE_MATCHES = 12;
const MAX_MULTIPLEX_MATCHES = 18;

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  // datetime-local n'accepte pas le suffixe "Z"/offset — on tronque à la minute locale.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initialFreeRows(existing?: CustomLogItem): MatchRow[] {
  if (existing) {
    return existing.matches.map((m) => ({
      name: m.name,
      kickoffAt: toDatetimeLocal(m.kickoffAt),
    }));
  }
  return [{ name: "", kickoffAt: "" }];
}

function matchLabel(match: MatchListItem): string {
  return `${match.home_team?.name ?? "?"} – ${match.away_team?.name ?? "?"}`;
}

// Deux flux distincts derrière une même modale : "single" (match personnalisé,
// saisie libre — hors référentiel PronoGoat) garde l'ancien formulaire texte
// ; "multiplex" sélectionne désormais de vrais matchs (MultiplexMatchPicker)
// et un MVP réel tiré de leurs compos, au lieu d'une saisie manuelle.
export function CustomLogModal({ onClose, mode, existingCustomLog }: CustomLogModalProps) {
  const isMultiplex = mode === "multiplex";

  // ---- Mode "single" : lignes en saisie libre, inchangé. ----
  const [rows, setRows] = useState<MatchRow[]>(() =>
    isMultiplex ? [] : initialFreeRows(existingCustomLog),
  );

  // ---- Mode "multiplex" : sélection de vrais matchs + MVP réel. ----
  const existingMatchIds = useMemo(
    () =>
      isMultiplex
        ? (existingCustomLog?.matches ?? [])
            .map((m) => m.matchId)
            .filter((id): id is string => !!id)
        : [],
    [isMultiplex, existingCustomLog],
  );
  // Une revue multiplex créée avant cette évolution n'a que des matchs saisis
  // librement (match_id absent) : rien à réhydrater, l'utilisateur doit
  // resélectionner les vrais matchs pour continuer à éditer cette revue.
  const hasLegacyFreeTextMatches =
    isMultiplex &&
    !!existingCustomLog &&
    existingMatchIds.length < existingCustomLog.matches.length;

  // Tant que l'utilisateur n'a pas touché à la sélection (nouveau multiplex,
  // ou édition pas encore réhydratée), `selectedMatches` se dérive des
  // matchs existants plutôt que d'être copiée dans un state par un effet —
  // premier choix de l'utilisateur (picker ou retrait) qui « détache »
  // ensuite la sélection de cette source dérivée.
  const needsPrefill = isMultiplex && existingMatchIds.length > 0;
  const { data: prefilledMatches, isLoading: isPrefillLoading } = useMatchesByIds(existingMatchIds);
  const [manualSelection, setManualSelection] = useState<MatchListItem[] | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const selectedMatches = manualSelection ?? (needsPrefill ? (prefilledMatches ?? []) : []);
  const isPrefillPending = needsPrefill && manualSelection === null && isPrefillLoading;

  const [motmPlayerId, setMotmPlayerId] = useState<string | null>(
    existingCustomLog?.motmPlayerId ?? null,
  );
  const { data: lineupPlayers, isLoading: lineupsLoading } = useLineupsForMatches(
    isMultiplex ? selectedMatches.map((m) => m.id) : [],
  );
  // Le MVP choisi doit toujours faire partie d'une compo des matchs encore
  // sélectionnés — dérivé plutôt que resynchronisé par un effet, pour ne
  // jamais effacer un MVP pré-rempli (édition) avant que la réhydratation
  // ou le chargement des compos ne soit terminé.
  const effectiveMotmPlayerId =
    !motmPlayerId || isPrefillPending || lineupsLoading || (lineupPlayers ?? []).some((p) => p.playerId === motmPlayerId)
      ? motmPlayerId
      : null;

  const playersByMatch = useMemo(() => {
    const map = new Map<string, { playerId: string; fullName: string; teamName: string }[]>();
    for (const player of lineupPlayers ?? []) {
      const list = map.get(player.matchId) ?? [];
      list.push(player);
      map.set(player.matchId, list);
    }
    return map;
  }, [lineupPlayers]);

  const [rating, setRating] = useState<number | null>(existingCustomLog?.rating ?? null);
  const [comment, setComment] = useState(existingCustomLog?.comment ?? "");
  const [watchedAt, setWatchedAt] = useState(
    existingCustomLog?.watchedAt ?? new Date().toISOString().slice(0, 10),
  );

  const saveCustomLog = useSaveCustomLog();
  const deleteCustomLog = useDeleteCustomLog();

  const title = existingCustomLog
    ? "Modifier la revue"
    : isMultiplex
      ? "Nouveau multiplex"
      : "Nouveau match personnalisé";

  const matchCount = isMultiplex ? selectedMatches.length : rows.length;

  const canSave = isMultiplex
    ? rating !== null && selectedMatches.length > 0
    : rating !== null && rows.length > 0 && rows.every((r) => r.name.trim().length > 0);

  function updateRow(index: number, patch: Partial<MatchRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) =>
      prev.length >= MAX_FREE_MATCHES ? prev : [...prev, { name: "", kickoffAt: "" }],
    );
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function removeSelectedMatch(matchId: string) {
    setManualSelection(selectedMatches.filter((m) => m.id !== matchId));
  }

  async function handleSave() {
    if (!canSave || rating === null) return;
    try {
      const matches = isMultiplex
        ? selectedMatches.map((m) => ({
            name: matchLabel(m),
            kickoffAt: m.kickoff_at,
            matchId: m.id,
          }))
        : rows.map((r) => ({
            name: r.name.trim(),
            kickoffAt: r.kickoffAt ? new Date(r.kickoffAt).toISOString() : null,
          }));

      await saveCustomLog.mutateAsync({
        id: existingCustomLog?.id,
        rating,
        comment: comment.trim() || null,
        watchedAt,
        matches,
        motmPlayerId: isMultiplex ? effectiveMotmPlayerId : null,
      });
      onClose();
    } catch {
      // saveCustomLog.isError pilote le bandeau d'erreur ci-dessous, la modale reste ouverte.
    }
  }

  async function handleDelete() {
    if (!existingCustomLog) return;
    try {
      await deleteCustomLog.mutateAsync(existingCustomLog.id);
      onClose();
    } catch {
      // Échec déjà signalé par le toast (avec action Réessayer) du hook —
      // on laisse le modal ouvert pour que l'utilisateur puisse relancer.
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[640px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-bold [font-stretch:104%] text-[18px]">{title}</h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        {isMultiplex ? (
          <div className="mb-6">
            <label className="champ-label">Matchs du multiplex</label>

            {hasLegacyFreeTextMatches && selectedMatches.length === 0 && (
              <div className="mb-3 rounded-[10px] border border-ligne bg-nuit-haute/40 px-3.5 py-3">
                <p className="text-gris-fonce text-[12.5px] mb-2">
                  Cette revue vient de l'ancien format multiplex (matchs saisis
                  librement) — resélectionne les vrais matchs pour continuer.
                </p>
                <ul className="text-gris text-[12.5px] space-y-0.5">
                  {existingCustomLog?.matches.map((m) => (
                    <li key={m.id}>• {m.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedMatches.length > 0 && (
              <div className="space-y-1.5 mb-2.5">
                {selectedMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border border-ligne bg-nuit"
                  >
                    <span className="flex-1 min-w-0 text-[13px] font-semibold truncate">
                      {matchLabel(match)}
                    </span>
                    <span className="font-data text-[10.5px] text-gris-fonce shrink-0">
                      {match.competition?.name ?? ""}
                    </span>
                    <Button
                      type="button"
                      variant="discret"
                      iconOnly
                      aria-label="Retirer ce match"
                      onClick={() => removeSelectedMatch(match.id)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="secondaire"
              size="sm"
              onClick={() => setIsPickerOpen(true)}
            >
              {selectedMatches.length > 0 ? "Modifier la sélection" : "+ Sélectionner des matchs"}
            </Button>
            <p className="text-gris-fonce text-[11.5px] mt-1.5">
              Jusqu'à {MAX_MULTIPLEX_MATCHES} matchs, choisis parmi les matchs d'Eleven Logs.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <label className="champ-label">
              {rows.length > 1 ? "Matchs du multiplex" : "Nom du match"}
            </label>
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className="champ-input flex-1"
                    placeholder="Ex. PSG – OM (stream Twitch)"
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    maxLength={120}
                  />
                  <input
                    type="datetime-local"
                    className="champ-input w-[170px] shrink-0"
                    value={row.kickoffAt}
                    onChange={(e) => updateRow(index, { kickoffAt: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="discret"
                    iconOnly
                    aria-label="Retirer ce match"
                    disabled={rows.length <= 1}
                    onClick={() => removeRow(index)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
            {rows.length < MAX_FREE_MATCHES && (
              <Button
                type="button"
                variant="secondaire"
                size="sm"
                className="mt-2.5"
                onClick={addRow}
              >
                + Ajouter un match
              </Button>
            )}
          </div>
        )}

        {isMultiplex && (
          <div className="mb-6">
            <label htmlFor="multiplex-motm" className="champ-label">
              MVP du multiplex{" "}
              <span className="text-gris-fonce normal-case">— facultatif</span>
            </label>
            {selectedMatches.length === 0 ? (
              <p className="text-gris-fonce text-[13px]">
                Sélectionne des matchs pour choisir un MVP parmi leurs compos.
              </p>
            ) : (lineupPlayers ?? []).length === 0 ? (
              <p className="text-gris-fonce text-[13px]">
                Aucune compo disponible pour ces matchs.
              </p>
            ) : (
              <select
                id="multiplex-motm"
                className="champ-input"
                value={effectiveMotmPlayerId ?? ""}
                onChange={(e) => setMotmPlayerId(e.target.value || null)}
              >
                <option value="">Aucun MVP</option>
                {selectedMatches.map((match) => {
                  const players = playersByMatch.get(match.id);
                  if (!players || players.length === 0) return null;
                  return (
                    <optgroup key={match.id} label={matchLabel(match)}>
                      {players.map((p) => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.fullName} ({p.teamName})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="champ-label">
            Note globale <span className="text-projecteur normal-case">— obligatoire</span>
          </label>
          <p className="text-gris-fonce text-[12.5px] mb-2">
            Une seule note pour {matchCount > 1 ? "l'ensemble du multiplex" : "ce match"}.
          </p>
          <LedRatingBar value={rating} onChange={setRating} />
        </div>

        <div className="mb-4">
          <label htmlFor="custom-log-watched-at" className="champ-label">
            Vu le
          </label>
          <input
            id="custom-log-watched-at"
            type="date"
            className="champ-input"
            value={watchedAt}
            onChange={(e) => setWatchedAt(e.target.value)}
          />
        </div>

        <Textarea
          label="Commentaire"
          helper="Toujours facultatif."
          placeholder="Ce que tu retiendras…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {saveCustomLog.isError && (
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
              isLoading={saveCustomLog.isPending}
            >
              Réessayer
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-6">
          {existingCustomLog ? (
            <Button
              variant="destructif"
              onClick={handleDelete}
              isLoading={deleteCustomLog.isPending}
            >
              Supprimer
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={handleSave} disabled={!canSave} isLoading={saveCustomLog.isPending}>
            Enregistrer
          </Button>
        </div>
      </div>

      {isPickerOpen && (
        <MultiplexMatchPicker
          selected={selectedMatches}
          max={MAX_MULTIPLEX_MATCHES}
          onClose={() => setIsPickerOpen(false)}
          onConfirm={(matches) => {
            setManualSelection(matches);
            setIsPickerOpen(false);
          }}
        />
      )}
    </div>,
    document.body,
  );
}
