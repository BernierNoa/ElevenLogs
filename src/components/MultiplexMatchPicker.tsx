import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/Button";
import { useMatches, type MatchListItem } from "../hooks/useMatches";
import { formatKickoff } from "../lib/formatDate";
import { abbreviateTeamName } from "../lib/teamAbbreviation";
import { crestGradient } from "../lib/crestGradient";
import { showToast } from "../lib/toastStore";

export interface MultiplexMatchPickerProps {
  /** Sélection actuelle (venant de CustomLogModal) — copiée en état local le
   * temps de l'édition, seul "Valider" la répercute chez l'appelant. */
  selected: MatchListItem[];
  max: number;
  onConfirm: (matches: MatchListItem[]) => void;
  onClose: () => void;
}

const WINDOW_DAYS_PAST = 21;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dayKey(iso) === dayKey(today.toISOString())) return "Aujourd'hui";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Hier";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(d);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function matchesSearch(match: MatchListItem, query: string): boolean {
  if (!query) return true;
  const haystack = normalize(
    [match.home_team?.name, match.away_team?.name, match.competition?.name]
      .filter(Boolean)
      .join(" "),
  );
  return haystack.includes(normalize(query));
}

function MiniCrest({ name, logoUrl }: { name?: string | null; logoUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  const label = name ?? "?";

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="w-6 h-6 rounded-md shrink-0 object-contain bg-nuit-haute"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className="w-6 h-6 rounded-md shrink-0 grid place-items-center font-data text-[9px] font-bold text-projecteur"
      style={{ background: crestGradient(label) }}
    >
      {abbreviateTeamName(label)}
    </span>
  );
}

// Sélecteur de matchs réels pour le multiplex : remplace la saisie libre par
// une recherche + sélection dans le référentiel (fenêtre glissante, comme la
// page Matchs), plafonnée à `max`. Porté au-dessus de CustomLogModal (déjà
// une portal) — z-index supérieur pour rester au-dessus.
export function MultiplexMatchPicker({
  selected,
  max,
  onConfirm,
  onClose,
}: MultiplexMatchPickerProps) {
  const [pending, setPending] = useState<MatchListItem[]>(selected);
  const [query, setQuery] = useState("");

  const { from, to } = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const windowStart = new Date(todayStart);
    windowStart.setDate(windowStart.getDate() - WINDOW_DAYS_PAST);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return { from: windowStart.toISOString(), to: tomorrowStart.toISOString() };
  }, []);

  const { data: matches, isLoading, isError, refetch } = useMatches({ from, to });

  const pendingIds = new Set(pending.map((m) => m.id));

  const filtered = (matches ?? []).filter((m) => matchesSearch(m, query));

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; matches: MatchListItem[] }>();
    for (const match of filtered) {
      const key = dayKey(match.kickoff_at);
      const group = map.get(key);
      if (group) group.matches.push(match);
      else map.set(key, { label: dayLabel(match.kickoff_at), matches: [match] });
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, g]) => ({
        key,
        label: g.label,
        matches: [...g.matches].sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at)),
      }));
  }, [filtered]);

  function toggle(match: MatchListItem) {
    setPending((prev) => {
      if (prev.some((m) => m.id === match.id)) {
        return prev.filter((m) => m.id !== match.id);
      }
      if (prev.length >= max) {
        showToast(`Maximum ${max} matchs dans un multiplex`);
        return prev;
      }
      return [...prev, match];
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[560px] max-h-[85vh] sm:max-h-[90vh] flex flex-col rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4 shrink-0" />

        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <h2 className="font-display font-bold [font-stretch:104%] text-[18px]">
            Sélectionner des matchs
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <input
          className="champ-input mb-3 shrink-0"
          placeholder="Rechercher une équipe, une compétition…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          <span className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.08em]">
            {pending.length} / {max} sélectionnés
          </span>
          {pending.length > 0 && (
            <button
              type="button"
              className="font-data text-[11px] text-carton uppercase tracking-[0.08em]"
              onClick={() => setPending([])}
            >
              Tout retirer
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {isLoading && <p className="text-gris-fonce text-[13px]">Chargement…</p>}

          {isError && (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-carton text-[13px]">Impossible de charger les matchs.</p>
              <Button variant="secondaire" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          )}

          {!isLoading && !isError && groups.length === 0 && (
            <p className="text-gris-fonce text-[13px]">Aucun match ne correspond à cette recherche.</p>
          )}

          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="font-data text-[10px] tracking-[0.1em] uppercase text-gris-fonce mb-2">
                  {group.label}
                </div>
                <div className="space-y-1.5">
                  {group.matches.map((match) => {
                    const isSelected = pendingIds.has(match.id);
                    return (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => toggle(match)}
                        className={[
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border text-left transition-colors",
                          isSelected
                            ? "border-projecteur-fonce bg-pelouse/30"
                            : "border-ligne bg-nuit hover:border-gris-fonce",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "w-4 h-4 rounded-[4px] border shrink-0 grid place-items-center",
                            isSelected
                              ? "bg-projecteur border-projecteur"
                              : "border-gris-fonce",
                          ].join(" ")}
                        >
                          {isSelected && (
                            <span className="text-nuit text-[10px] leading-none">✓</span>
                          )}
                        </span>
                        <MiniCrest name={match.home_team?.name} logoUrl={match.home_team?.logo_url} />
                        <span className="flex-1 min-w-0 text-[13px] font-semibold truncate">
                          {match.home_team?.name ?? "?"} – {match.away_team?.name ?? "?"}
                        </span>
                        <MiniCrest name={match.away_team?.name} logoUrl={match.away_team?.logo_url} />
                        <span className="font-data text-[10.5px] text-gris-fonce shrink-0 whitespace-nowrap">
                          {formatKickoff(match.kickoff_at)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5 pt-4 border-t border-ligne shrink-0">
          <Button variant="discret" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => onConfirm(pending)}>Valider la sélection</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
