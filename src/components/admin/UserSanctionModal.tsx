import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/Button";
import { StatusBadge } from "./StatusBadge";
import { useAdminUserActions } from "../../hooks/useAdminUserActions";
import { showToast } from "../../lib/toastStore";

export interface UserSanctionModalProps {
  userId: string;
  displayName: string;
  bannedAt: string | null;
  suspendedUntil: string | null;
  onClose: () => void;
}

const SUSPEND_OPTIONS: { label: string; hours: number }[] = [
  { label: "24 heures", hours: 24 },
  { label: "7 jours", hours: 24 * 7 },
  { label: "30 jours", hours: 24 * 30 },
];

// Confirmation en deux temps inline, même pattern que MatchDeleteRow
// (Admin.tsx) : pas de composant partagé pour ça dans le projet, on répète
// volontairement le même geste plutôt que d'introduire une abstraction.
function ConfirmAction({
  label,
  confirmLabel,
  variant,
  isLoading,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  variant: "destructif" | "secondaire";
  isLoading: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant={variant} size="sm" onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11.5px] text-gris-fonce">Confirmer ?</span>
      <Button variant={variant} size="sm" isLoading={isLoading} onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button variant="discret" size="sm" onClick={() => setConfirming(false)}>
        Annuler
      </Button>
    </div>
  );
}

export function UserSanctionModal({
  userId,
  displayName,
  bannedAt,
  suspendedUntil,
  onClose,
}: UserSanctionModalProps) {
  const { banUser, unbanUser, suspendUser, unsuspendUser, forcePrivate } =
    useAdminUserActions();

  const isSuspended = !!suspendedUntil && new Date(suspendedUntil) > new Date();
  const isBanned = !!bannedAt;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[440px] rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="font-display font-bold [font-stretch:104%] text-[16px]">
            Sanctionner {displayName}
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="mb-5">
          <StatusBadge bannedAt={bannedAt} suspendedUntil={suspendedUntil} />
        </div>

        <div className="space-y-4">
          {isBanned ? (
            <ConfirmAction
              label="Lever le ban"
              confirmLabel="Oui, lever le ban"
              variant="secondaire"
              isLoading={unbanUser.isPending}
              onConfirm={() =>
                unbanUser.mutate(userId, {
                  onSuccess: () => showToast("Ban levé."),
                  onError: () => showToast("Action impossible."),
                })
              }
            />
          ) : (
            <>
              <div>
                <div className="champ-label">Suspendre temporairement</div>
                <div className="flex flex-wrap gap-2">
                  {SUSPEND_OPTIONS.map((opt) => (
                    <Button
                      key={opt.hours}
                      variant="secondaire"
                      size="sm"
                      isLoading={suspendUser.isPending}
                      onClick={() =>
                        suspendUser.mutate(
                          {
                            userId,
                            until: new Date(
                              Date.now() + opt.hours * 60 * 60 * 1000,
                            ).toISOString(),
                          },
                          {
                            onSuccess: () => showToast(`Suspendu ${opt.label}.`),
                            onError: () => showToast("Action impossible."),
                          },
                        )
                      }
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {isSuspended && (
                <ConfirmAction
                  label="Lever la suspension"
                  confirmLabel="Oui, lever la suspension"
                  variant="secondaire"
                  isLoading={unsuspendUser.isPending}
                  onConfirm={() =>
                    unsuspendUser.mutate(userId, {
                      onSuccess: () => showToast("Suspension levée."),
                      onError: () => showToast("Action impossible."),
                    })
                  }
                />
              )}

              <div>
                <div className="champ-label">Sanction définitive</div>
                <ConfirmAction
                  label="Bannir définitivement"
                  confirmLabel="Oui, bannir"
                  variant="destructif"
                  isLoading={banUser.isPending}
                  onConfirm={() =>
                    banUser.mutate(userId, {
                      onSuccess: () => showToast("Compte banni."),
                      onError: () => showToast("Action impossible."),
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="pt-4 border-t border-ligne">
            <div className="champ-label">Autre action</div>
            <ConfirmAction
              label="Forcer le profil en privé"
              confirmLabel="Oui, forcer en privé"
              variant="secondaire"
              isLoading={forcePrivate.isPending}
              onConfirm={() =>
                forcePrivate.mutate(userId, {
                  onSuccess: () => showToast("Profil forcé en privé."),
                  onError: () => showToast("Action impossible."),
                })
              }
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
