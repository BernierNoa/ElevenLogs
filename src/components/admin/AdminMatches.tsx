import { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatKickoff } from "../../lib/formatDate";
import { detectAnomalousTeamIds } from "../../lib/matchAnomalies";
import { useAdminMatchActions } from "../../hooks/useAdminMatchActions";
import { showToast } from "../../lib/toastStore";
import { MatchEditModal } from "./MatchEditModal";
import type { AdminMatchItem } from "../../hooks/useAdminMatches";

export interface AdminMatchesProps {
  matches: AdminMatchItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

type DateFilter = "all" | "today" | "upcoming" | "past";

const PAGE_SIZE = 25;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function matchesDateFilter(kickoffAt: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const kickoff = new Date(kickoffAt);

  if (filter === "today") return kickoff >= today && kickoff < tomorrow;
  if (filter === "upcoming") return kickoff >= tomorrow;
  return kickoff < today;
}

export function AdminMatches({ matches, isLoading, isError, onRetry }: AdminMatchesProps) {
  const [query, setQuery] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [editingMatch, setEditingMatch] = useState<AdminMatchItem | null>(null);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);

  const { bulkDeleteMatches } = useAdminMatchActions();

  const anomalousTeamIds = useMemo(() => detectAnomalousTeamIds(matches), [matches]);

  const competitions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const m of matches) {
      if (m.competition) byId.set(m.competition.id, m.competition.name);
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  const trimmedQuery = query.trim().toLowerCase();

  const filtered = matches.filter((m) => {
    if (competitionId && m.competition?.id !== competitionId) return false;
    if (!matchesDateFilter(m.kickoff_at, dateFilter)) return false;
    if (anomaliesOnly) {
      const isAnomalous =
        (m.home_team && anomalousTeamIds.has(m.home_team.id)) ||
        (m.away_team && anomalousTeamIds.has(m.away_team.id));
      if (!isAnomalous) return false;
    }
    if (trimmedQuery) {
      const haystack = [m.competition?.name, m.home_team?.name, m.away_team?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(trimmedQuery)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  function resetPage() {
    setPage(0);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageSelection() {
    const pageIds = pageItems.map((m) => m.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function handleBulkDelete() {
    bulkDeleteMatches.mutate([...selectedIds], {
      onSuccess: () => {
        showToast(`${selectedIds.size} match(s) supprimé(s).`);
        setSelectedIds(new Set());
        setConfirmingBulkDelete(false);
      },
      onError: () => {
        showToast(
          "Suppression impossible — des utilisateurs ont probablement déjà loggé un de ces matchs.",
        );
        setConfirmingBulkDelete(false);
      },
    });
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-carton text-[13px]">Impossible de charger les matchs.</p>
        <Button variant="secondaire" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-gris-fonce text-[13px]">Chargement…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          className="champ-input text-[13.5px] py-2 max-w-[280px]"
          placeholder="Chercher une équipe ou une compétition…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            resetPage();
          }}
        />

        <select
          className="champ-input w-auto py-1.5 px-3 text-[13px]"
          value={competitionId}
          onChange={(e) => {
            setCompetitionId(e.target.value);
            resetPage();
          }}
        >
          <option value="">Toutes les compétitions</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="champ-input w-auto py-1.5 px-3 text-[13px]"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value as DateFilter);
            resetPage();
          }}
        >
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="upcoming">À venir</option>
          <option value="past">Passés</option>
        </select>

        <button
          type="button"
          className={["filtre-chip", anomaliesOnly ? "actif" : ""].join(" ")}
          onClick={() => {
            setAnomaliesOnly((v) => !v);
            resetPage();
          }}
        >
          Anomalies détectées ({anomalousTeamIds.size})
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="carte flex items-center justify-between gap-3 flex-wrap mb-4">
          <span className="text-[13px]">
            {selectedIds.size} match{selectedIds.size > 1 ? "s" : ""} sélectionné
            {selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="discret" size="sm" onClick={() => setSelectedIds(new Set())}>
              Tout désélectionner
            </Button>
            {!confirmingBulkDelete ? (
              <Button
                variant="destructif"
                size="sm"
                onClick={() => setConfirmingBulkDelete(true)}
              >
                Supprimer la sélection
              </Button>
            ) : (
              <>
                <span className="text-[11.5px] text-gris-fonce">Confirmer ?</span>
                <Button
                  variant="destructif"
                  size="sm"
                  isLoading={bulkDeleteMatches.isPending}
                  onClick={handleBulkDelete}
                >
                  Oui, supprimer
                </Button>
                <Button variant="discret" size="sm" onClick={() => setConfirmingBulkDelete(false)}>
                  Annuler
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gris-fonce text-[13px]">Aucun match trouvé pour ces filtres.</p>
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map((match) => {
              const isAnomalous =
                (match.home_team && anomalousTeamIds.has(match.home_team.id)) ||
                (match.away_team && anomalousTeamIds.has(match.away_team.id));
              return (
                <div
                  key={match.id}
                  className={[
                    "carte flex items-center justify-between gap-3 flex-wrap",
                    isAnomalous ? "border-carton/50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(match.id)}
                      onChange={() => toggleSelected(match.id)}
                      className="shrink-0 w-4 h-4"
                      aria-label="Sélectionner ce match"
                    />
                    <div className="min-w-0">
                      <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] flex items-center gap-2">
                        {formatKickoff(match.kickoff_at)} · {match.competition?.name ?? ""}
                        {isAnomalous && <Badge variant="danger">Anomalie</Badge>}
                      </div>
                      <div className="font-display font-bold [font-stretch:104%] text-[14px] truncate">
                        {match.home_team?.name ?? "?"}
                        {match.home_score !== null && match.away_score !== null && (
                          <span className="chiffres text-gris-fonce mx-1.5">
                            {match.home_score}–{match.away_score}
                          </span>
                        )}
                        {" – "}
                        {match.away_team?.name ?? "?"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondaire" size="sm" onClick={() => setEditingMatch(match)}>
                      Corriger
                    </Button>
                    <Button
                      variant="destructif"
                      size="sm"
                      onClick={() => {
                        setSelectedIds(new Set([match.id]));
                        setConfirmingBulkDelete(true);
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 mt-5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pageItems.length > 0 && pageItems.every((m) => selectedIds.has(m.id))}
                onChange={togglePageSelection}
                className="w-4 h-4"
                aria-label="Sélectionner toute la page"
              />
              <span className="text-gris-fonce text-[12px]">Toute la page</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.06em]">
                Page {clampedPage + 1} / {totalPages} · {filtered.length} résultats
              </span>
              <Button
                variant="secondaire"
                size="sm"
                disabled={clampedPage === 0}
                onClick={() => setPage(clampedPage - 1)}
              >
                ←
              </Button>
              <Button
                variant="secondaire"
                size="sm"
                disabled={clampedPage >= totalPages - 1}
                onClick={() => setPage(clampedPage + 1)}
              >
                →
              </Button>
            </div>
          </div>
        </>
      )}

      {editingMatch && (
        <MatchEditModal match={editingMatch} onClose={() => setEditingMatch(null)} />
      )}
    </div>
  );
}
