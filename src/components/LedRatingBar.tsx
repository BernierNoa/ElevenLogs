const MOTS = [
  "Insipide",
  "Faible",
  "Quelconque",
  "Passable",
  "Correct",
  "Honnête",
  "Très bon match",
  "Grand match",
  "Match référence",
  "Légendaire",
];

export interface LedRatingBarProps {
  value: number | null;
  size?: "compact" | "normal";
  onChange?: (value: number) => void;
  /** N'a d'effet qu'en size="compact" : affiche la note en chiffres à côté
   * des points. Par défaut false pour ne pas dupliquer un chiffre déjà
   * affiché à côté de la barre par l'appelant (ex. RankedBarList). */
  showValue?: boolean;
}

// Composant signature réutilisé partout où une note apparaît : interactif si
// `onChange` est fourni (écran de log), lecture seule sinon (carte match,
// stats, classements) — même barre LED, juste une taille différente.
export function LedRatingBar({
  value,
  size = "normal",
  onChange,
  showValue = false,
}: LedRatingBarProps) {
  const interactive = onChange !== undefined;

  // Bar de lecture seule / compacte : 10 segments entiers (pour éviter une
  // UI trop dense). La sélection demi-point doit se faire sur la version
  // "normal" (modales).
  const segments10 = Array.from({ length: 10 }, (_, i) => i + 1);

  // Pas de demi-points : 1, 1.5, 2, ... , 10.
  const stepsHalf = Array.from({ length: 19 }, (_, i) =>
    Math.round((1 + i * 0.5) * 2) / 2,
  );

  if (size === "compact") {
    const dots = (
      <div
        className="flex gap-[2px] w-full"
        role={interactive ? undefined : "img"}
        aria-label={interactive ? undefined : `Note ${value ?? "non donnée"} sur 10`}
      >
        {segments10.map((n) => {
          const filled = value !== null && n <= value;
          const isTop = value !== null && n === value;
          const segmentClass = filled
            ? isTop
              ? "bg-projecteur"
              : "bg-pelouse"
            : "bg-nuit-haute";

          if (!interactive) {
            return (
              <span
                key={n}
                aria-hidden="true"
                className={`flex-1 h-[4px] rounded-full ${segmentClass}`}
              />
            );
          }

          return (
            <button
              key={n}
              type="button"
              aria-label={`Noter ${n} sur 10`}
              onClick={() => onChange(n)}
              className={`flex-1 h-[10px] rounded-[2px] border border-ligne transition-colors ${segmentClass}`}
            />
          );
        })}
      </div>
    );

    if (!showValue) return dots;

    return (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0">{dots}</div>
        <span
          aria-hidden="true"
          className="chiffres font-data text-[11px] font-bold text-projecteur shrink-0"
        >
          {value ?? "–"}
        </span>
      </div>
    );
  }

  // VERSION "normal" : si onChange fourni, on autorise la sélection 0.5
  // directement.
  const steps = interactive ? stepsHalf : segments10;

  const labelIndex =
    value === null
      ? null
      : Math.min(10, Math.max(1, Math.round(value)));

  return (
    <div>
      <div className="flex justify-between items-end mb-2.5">
        <div className="chiffres font-display font-black [font-stretch:118%] text-[46px] leading-[0.85] tracking-[-0.04em]">
          {value ?? "–"}
          <small className="text-[17px] text-gris-fonce font-semibold"> / 10</small>
        </div>
        <div className="font-data text-[11px] tracking-[0.14em] uppercase text-projecteur">
          {labelIndex ? MOTS[labelIndex - 1] : "Ta note"}
        </div>
      </div>

      <div className="flex gap-[3px] w-full">
        {steps.map((n) => {
          const filled = value !== null && n <= value + 1e-9;
          const isTop = value !== null && Math.abs(n - value) < 1e-9;
          return (
            <button
              key={n}
              type="button"
              aria-label={`Noter ${n} sur 10`}
              disabled={!interactive}
              onClick={() => onChange?.(n)}
              className={[
                "flex-1 h-[38px] rounded-[3px] border transition-colors",
                interactive ? "" : "cursor-default",
                filled
                  ? isTop
                    ? "bg-projecteur border-projecteur shadow-[0_0_14px_rgba(31,224,122,0.4)]"
                    : "bg-pelouse border-projecteur-fonce"
                  : "bg-nuit-haute border-ligne",
              ].join(" ")}
            />
          );
        })}
      </div>

      <div className="flex justify-between font-data text-[10px] text-gris-fonce mt-1.5 tracking-[0.08em]">
        <span>Insipide</span>
        <span>Correct</span>
        <span>Légendaire</span>
      </div>
    </div>
  );
}
