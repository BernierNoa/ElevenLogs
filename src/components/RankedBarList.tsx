import type { RankedItem } from "../hooks/useSeasonStats";
import { LedRatingBar } from "./LedRatingBar";

export interface RankedBarListProps {
  items: RankedItem[];
  accent?: "vert" | "or";
  formatValue?: (value: number) => string;
  emptyLabel: string;
  /** Affiche une LED bar compacte au lieu du texte — pour les valeurs qui
   * sont des notes /10 (moyennes par compétition/équipe), pas des comptes. */
  showLed?: boolean;
}

// Barres à teinte unique, magnitude par la longueur — pas de palette
// catégorielle nécessaire ici (une seule série par liste). Or réservé au
// classement MOTM, seul cas où ce token sort de son usage habituel (déjà la
// règle ailleurs dans l'app).
export function RankedBarList({
  items,
  accent = "vert",
  formatValue = (v) => String(v),
  emptyLabel,
  showLed = false,
}: RankedBarListProps) {
  if (items.length === 0) {
    return <p className="text-gris-fonce text-[13px]">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.value));
  const barClass = accent === "or" ? "bg-motm-gold/40" : "bg-pelouse";
  const valueClass = accent === "or" ? "text-motm-gold" : "text-projecteur";
  // Une barre à 100% partout (toutes les valeurs égales, ex. 20 joueurs à
  // "1×") ne représente rien — elle suggère un classement qu'il n'y a pas.
  // On ne la dessine que s'il existe une vraie variance à montrer.
  const hasVariance = items.some((i) => i.value !== items[0].value);

  return (
    <div>
      {items.map((item, index) => (
        <div
          key={item.key}
          className="flex items-center gap-2.5 py-2 border-b border-ligne last:border-b-0"
        >
          <span className="font-data text-[11px] text-gris-fonce w-5 shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate">{item.label}</div>
            {hasVariance && (
              <div className="h-[3px] bg-nuit-haute rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>
          {showLed ? (
            <span className="flex items-center gap-2 shrink-0">
              <span className="w-12">
                <LedRatingBar value={Math.round(item.value)} size="compact" />
              </span>
              <span className="chiffres font-data text-[12px] font-bold text-projecteur">
                {formatValue(item.value)}
              </span>
            </span>
          ) : (
            <span
              className={`chiffres font-data text-[12px] font-bold shrink-0 ${valueClass}`}
            >
              {formatValue(item.value)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
