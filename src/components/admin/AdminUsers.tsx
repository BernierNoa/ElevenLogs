import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StatusBadge } from "./StatusBadge";
import { UserDetailModal } from "./UserDetailModal";
import { UserSanctionModal } from "./UserSanctionModal";
import type { AdminUserRow } from "../../hooks/useAdminStats";

export interface AdminUsersProps {
  users: AdminUserRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

type SortKey = "displayName" | "logsCount" | "avgRating" | "createdAt" | "lastLogAt";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "displayName", label: "Pseudo" },
  { key: "logsCount", label: "Logs" },
  { key: "avgRating", label: "Note moy." },
  { key: "createdAt", label: "Inscrit le" },
  { key: "lastLogAt", label: "Dernier log" },
];

function compare(a: AdminUserRow, b: AdminUserRow, key: SortKey): number {
  switch (key) {
    case "displayName":
      return a.displayName.localeCompare(b.displayName);
    case "logsCount":
      return a.logsCount - b.logsCount;
    case "avgRating":
      return (a.avgRating ?? -1) - (b.avgRating ?? -1);
    case "createdAt":
      return a.createdAt.localeCompare(b.createdAt);
    case "lastLogAt":
      return (a.lastLogAt ?? "").localeCompare(b.lastLogAt ?? "");
  }
}

export function AdminUsers({ users, isLoading, isError, onRetry }: AdminUsersProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("logsCount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [sanctionUserId, setSanctionUserId] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = users.filter((u) => u.displayName.toLowerCase().includes(trimmedQuery));
  const sorted = [...filtered].sort((a, b) => {
    const c = compare(a, b, sortKey);
    return sortDir === "asc" ? c : -c;
  });

  const detailUser = users.find((u) => u.userId === detailUserId);
  const sanctionUser = users.find((u) => u.userId === sanctionUserId);

  return (
    <div>
      <input
        type="search"
        className="champ-input text-[13.5px] py-2 max-w-[320px] mb-4"
        placeholder="Chercher un pseudo…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Card>
        {isError ? (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-carton text-[13px]">Impossible de charger les utilisateurs.</p>
            <Button variant="secondaire" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        ) : isLoading ? (
          <p className="text-gris-fonce text-[13px]">Chargement…</p>
        ) : sorted.length === 0 ? (
          <p className="text-gris-fonce text-[13px]">Aucun utilisateur pour ce filtre.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] border-b border-ligne">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="py-2 pr-3">
                      <button
                        type="button"
                        className={`flex items-center gap-1 hover:text-craie transition-colors ${sortKey === col.key ? "text-projecteur" : ""}`}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        {sortKey === col.key && (sortDir === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                  ))}
                  <th className="py-2 pr-3">Profil</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((u) => (
                  <tr key={u.userId} className="border-b border-ligne last:border-b-0">
                    <td className="py-2 pr-3 font-semibold truncate max-w-[160px]">
                      {u.displayName}
                    </td>
                    <td className="py-2 pr-3 chiffres">{u.logsCount}</td>
                    <td className="py-2 pr-3 chiffres">
                      {u.avgRating !== null ? u.avgRating.toFixed(1) : "–"}
                    </td>
                    <td className="py-2 pr-3 text-gris-fonce whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-2 pr-3 text-gris-fonce whitespace-nowrap">
                      {u.lastLogAt ? new Date(u.lastLogAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="py-2 pr-3 text-gris-fonce">
                      {u.profileVisibility === "private" ? "Privé" : "Public"}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge bannedAt={u.bannedAt} suspendedUntil={u.suspendedUntil} />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="secondaire"
                          size="sm"
                          onClick={() => setDetailUserId(u.userId)}
                        >
                          Détail
                        </Button>
                        <Button
                          variant="destructif"
                          size="sm"
                          onClick={() => setSanctionUserId(u.userId)}
                        >
                          Sanctionner
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detailUser && (
        <UserDetailModal
          userId={detailUser.userId}
          displayName={detailUser.displayName}
          onClose={() => setDetailUserId(null)}
        />
      )}

      {sanctionUser && (
        <UserSanctionModal
          userId={sanctionUser.userId}
          displayName={sanctionUser.displayName}
          bannedAt={sanctionUser.bannedAt}
          suspendedUntil={sanctionUser.suspendedUntil}
          onClose={() => setSanctionUserId(null)}
        />
      )}
    </div>
  );
}
