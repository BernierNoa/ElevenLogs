import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { LedRatingBar } from "./LedRatingBar";
import { useSaveCustomLog } from "../hooks/useSaveCustomLog";
import { useDeleteCustomLog } from "../hooks/useDeleteCustomLog";
import type { CustomLogItem } from "../hooks/useCustomLogs";

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

const MAX_MATCHES = 12;

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  // datetime-local n'accepte pas le suffixe "Z"/offset — on tronque à la minute locale.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initialRows(mode: "single" | "multiplex", existing?: CustomLogItem): MatchRow[] {
  if (existing) {
    return existing.matches.map((m) => ({
      name: m.name,
      kickoffAt: toDatetimeLocal(m.kickoffAt),
    }));
  }
  const rowCount = mode === "multiplex" ? 2 : 1;
  return Array.from({ length: rowCount }, () => ({ name: "", kickoffAt: "" }));
}

export function CustomLogModal({ onClose, mode, existingCustomLog }: CustomLogModalProps) {
  const [rows, setRows] = useState<MatchRow[]>(() => initialRows(mode, existingCustomLog));
  const [rating, setRating] = useState<number | null>(existingCustomLog?.rating ?? null);
  const [comment, setComment] = useState(existingCustomLog?.comment ?? "");
  const [watchedAt, setWatchedAt] = useState(
    existingCustomLog?.watchedAt ?? new Date().toISOString().slice(0, 10),
  );

  const saveCustomLog = useSaveCustomLog();
  const deleteCustomLog = useDeleteCustomLog();

  const title = existingCustomLog
    ? "Modifier la revue"
    : mode === "multiplex"
      ? "Nouveau multiplex"
      : "Nouveau match personnalisé";

  const canSave =
    rating !== null && rows.length > 0 && rows.every((r) => r.name.trim().length > 0);

  function updateRow(index: number, patch: Partial<MatchRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => (prev.length >= MAX_MATCHES ? prev : [...prev, { name: "", kickoffAt: "" }]));
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSave() {
    if (!canSave || rating === null) return;
    try {
      await saveCustomLog.mutateAsync({
        id: existingCustomLog?.id,
        rating,
        comment: comment.trim() || null,
        watchedAt,
        matches: rows.map((r) => ({
          name: r.name.trim(),
          kickoffAt: r.kickoffAt ? new Date(r.kickoffAt).toISOString() : null,
        })),
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
          {rows.length < MAX_MATCHES && (
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

        <div className="mb-6">
          <label className="champ-label">
            Note globale <span className="text-projecteur normal-case">— obligatoire</span>
          </label>
          <p className="text-gris-fonce text-[12.5px] mb-2">
            Une seule note pour {rows.length > 1 ? "l'ensemble du multiplex" : "ce match"}.
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
    </div>,
    document.body,
  );
}
