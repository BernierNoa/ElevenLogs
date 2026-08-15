import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useAdminUserDetail } from "../../hooks/useAdminUserDetail";

export interface UserDetailModalProps {
  userId: string;
  displayName: string;
  onClose: () => void;
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inapproprie: "Contenu inapproprié",
  harcelement: "Harcèlement",
};

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mb-2.5">
        {title}
      </div>
      {children}
    </div>
  );
}

export function UserDetailModal({ userId, displayName, onClose }: UserDetailModalProps) {
  const { data, isLoading, isError, refetch } = useAdminUserDetail(userId);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[560px] max-h-[85vh] flex flex-col rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <h2 className="font-display font-bold [font-stretch:104%] text-[16px] truncate">
            {displayName}
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="overflow-y-auto -mx-6 px-6">
          {isLoading && <p className="text-gris-fonce text-[13px]">Chargement…</p>}

          {!isLoading && isError && (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-carton text-[13px]">Impossible de charger le détail.</p>
              <Button variant="secondaire" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          )}

          {data && (
            <>
              <SubSection title={`Signalements reçus (${data.reportsReceived.length})`}>
                {data.reportsReceived.length === 0 ? (
                  <p className="text-gris-fonce text-[12.5px]">Aucun.</p>
                ) : (
                  <div className="space-y-2">
                    {data.reportsReceived.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                        <span className="truncate min-w-0">{r.matchLabel}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-gris-fonce">
                            {REASON_LABELS[r.reason] ?? r.reason}
                          </span>
                          <Badge variant={r.status === "pending" ? "danger" : "default"}>
                            {r.status}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SubSection>

              <SubSection title={`Signalements émis (${data.reportsMade.length})`}>
                {data.reportsMade.length === 0 ? (
                  <p className="text-gris-fonce text-[12.5px]">Aucun.</p>
                ) : (
                  <div className="space-y-2">
                    {data.reportsMade.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                        <span className="truncate min-w-0">{r.matchLabel}</span>
                        <span className="text-gris-fonce shrink-0">
                          {REASON_LABELS[r.reason] ?? r.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SubSection>

              <SubSection title={`Logs (${data.logs.length}${data.logs.length >= 50 ? "+" : ""})`}>
                {data.logs.length === 0 ? (
                  <p className="text-gris-fonce text-[12.5px]">Aucun log.</p>
                ) : (
                  <div className="space-y-2">
                    {data.logs.map((l) => (
                      <div key={l.id} className="text-[12.5px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate min-w-0">{l.matchLabel}</span>
                          <span className="chiffres text-projecteur font-bold shrink-0">
                            {l.rating}/10
                          </span>
                        </div>
                        {l.comment && (
                          <p className="text-gris-fonce mt-0.5 truncate">{l.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SubSection>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
