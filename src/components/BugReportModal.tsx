import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { showToast } from "../lib/toastStore";
import { useBugReportMutation, type BugType } from "../hooks/useBugReportMutation";

export interface BugReportModalProps {
  onClose: () => void;
}

const BUG_TYPES: { value: BugType; label: string }[] = [
  { value: "affichage", label: "Affichage / visuel" },
  { value: "fonctionnalite", label: "Une fonctionnalité ne marche pas" },
  { value: "donnees", label: "Donnée incorrecte (match, note…)" },
  { value: "autre", label: "Autre" },
];

export function BugReportModal({ onClose }: BugReportModalProps) {
  const [bugType, setBugType] = useState<BugType | null>(null);
  const [description, setDescription] = useState("");
  const report = useBugReportMutation();

  const canSubmit = !!bugType && description.trim().length >= 5;

  function handleSubmit() {
    if (!bugType || !canSubmit) return;
    report.mutate(
      { bugType, description: description.trim() },
      {
        onSuccess: () => {
          showToast("Merci, le bug a été signalé !");
          onClose();
        },
        onError: () => showToast("Envoi impossible, réessaie plus tard."),
      },
    );
  }

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

        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="font-display font-bold [font-stretch:104%] text-[18px]">
            Signaler un bug
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>
        <p className="text-gris-fonce text-[12.5px] mb-5">
          Décris ce qui ne va pas, on regarde ça au plus vite.
        </p>

        <p className="champ-label">Type de bug</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {BUG_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={["filtre-chip", bugType === t.value ? "actif" : ""].join(" ")}
              onClick={() => setBugType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Textarea
          label="Description"
          placeholder="Ce qui s'est passé, ce que tu attendais à la place…"
          rows={4}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="discret" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primaire"
            size="sm"
            disabled={!canSubmit}
            isLoading={report.isPending}
            onClick={handleSubmit}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
