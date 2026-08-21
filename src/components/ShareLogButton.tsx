import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { useSession, useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { ShareCard, type ShareFormat } from "./ShareCard";
import { showToast } from "../lib/toastStore";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { proxiedImageUrl } from "../lib/imageProxy";

export interface ShareLogButtonProps {
  competitionName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  rating: number;
  motmName: string | null;
  comment: string | null;
  competitionLogoUrl?: string | null;
  homeTeamLogoUrl?: string | null;
  awayTeamLogoUrl?: string | null;
}

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const canCopyImages =
  typeof navigator !== "undefined" &&
  typeof ClipboardItem !== "undefined" &&
  !!navigator.clipboard?.write;

const canNativeShare =
  typeof navigator !== "undefined" &&
  typeof (navigator as Navigator & { share?: unknown }).share === "function" &&
  typeof (window as Window & { File?: unknown }).File !== "undefined";

// Uniquement pour le log de l'utilisateur courant : les props viennent
// toujours de l'état local de LogMatchModal (jamais d'un tiers), et
// ShareCard ne rend que ce qu'on lui passe explicitement.
export function ShareLogButton(props: ShareLogButtonProps) {
  const [format, setFormat] = useState<ShareFormat>("story");
  const [isBusy, setIsBusy] = useState<"download" | "copy" | "share" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { session } = useSession();

  // Identité de qui logge (toujours le compte connecté ici) — auto-résolue
  // plutôt que passée en prop : ShareLogButton n'est monté que depuis le log
  // de l'utilisateur courant (cf. LogMatchModal), jamais celui d'un tiers.
  const { user } = useUser();
  const { data: myProfile } = useProfileSettings(user?.id);

  const [dataUrlOverrides, setDataUrlOverrides] = useState<{
    competitionLogoUrl: string | null;
    homeTeamLogoUrl: string | null;
    awayTeamLogoUrl: string | null;
  } | null>(null);

  async function fetchImageAsDataUrl(sourceUrl: string | null | undefined) {
    if (!sourceUrl) return null;
    if (sourceUrl.startsWith("data:")) return sourceUrl;

    // On passe par image-proxy (qui peut requérir un auth JWT) et on
    // convertit ensuite en data URL pour que html-to-image n'ait plus
    // besoin de refaire des fetch cross-origin.
    const proxied = proxiedImageUrl(sourceUrl);
    if (!proxied) return null;

    const token = (await session?.getToken()) ?? null;
    if (!token) return null;

    const res = await fetch(proxied, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_blob_failed"));
      reader.onloadend = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  }

  async function captureBlob(): Promise<Blob | null> {
    if (!cardRef.current) return null;

    // Précharge les logos via auth (si nécessaire), convertis en data URLs,
    // puis seulement après capture.
    if (session) {
      try {
        const [competition, home, away] = await Promise.all([
          fetchImageAsDataUrl(props.competitionLogoUrl),
          fetchImageAsDataUrl(props.homeTeamLogoUrl),
          fetchImageAsDataUrl(props.awayTeamLogoUrl),
        ]);
        setDataUrlOverrides({
          competitionLogoUrl: competition,
          homeTeamLogoUrl: home,
          awayTeamLogoUrl: away,
        });

        // Laisse React appliquer le rendu avant html-to-image.
        // (un seul setTimeout(0) est parfois insuffisant sur mobile)
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve()),
          ),
        );
      } catch {
        // fallback : on garde les URLs originales + imagePlaceholder
      }
    }
    // pixelRatio 1 : les dimensions du composant sont déjà en pixels finaux
    // (1080×1920 / 1080×1080), pas la peine de sur-échantillonner.
    //
    // imagePlaceholder est indispensable dès qu'un <img> externe apparaît
    // dans ShareCard (crests, avatar, logo compétition) : html-to-image
    // re-fetch chaque image pour l'intégrer en data URI, et si ce fetch
    // échoue (CORS, 404...), il pose src="" sur le noeud cloné — ce qui
    // déclenche onerror et fait échouer TOUTE la capture, pas seulement
    // cette image. Sans placeholder, une seule image indisponible cassait
    // l'export entier ("Impossible de générer l'image"). Avec, l'image
    // manquante devient juste transparente et le reste s'exporte normalement.
    return toBlob(cardRef.current, {
      pixelRatio: 1,
      imagePlaceholder: TRANSPARENT_PIXEL,
    });
  }

  async function handleDownload() {
    setIsBusy("download");
    try {
      const blob = await captureBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eleven-logs-${format}-${homeAwaySlug(props.homeTeamName, props.awayTeamName)}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Impossible de générer l'image");
    } finally {
      setIsBusy(null);
    }
  }

  async function handleShare() {
    if (!canNativeShare) return;
    setIsBusy("share");

    try {
      const blob = await captureBlob();
      if (!blob) return;

      const file = new File(
        [blob],
        `eleven-logs-${format}-${homeAwaySlug(
          props.homeTeamName,
          props.awayTeamName,
        )}.png`,
        { type: "image/png" },
      );

      type ShareDataWithFiles = {
        title?: string;
        text?: string;
        files?: File[];
      };

      const shareData: ShareDataWithFiles = {
        title: "Eleven Logs",
        text: "Ma note ElevenLogs",
        files: [file],
      };

      const navWithShare = navigator as Navigator & {
        share: (data: ShareDataWithFiles) => Promise<void>;
        canShare?: (data: ShareDataWithFiles) => boolean;
      };

      if (typeof navWithShare.canShare === "function" && !navWithShare.canShare(shareData)) {
        // Fallback : au moins l'utilisateur récupère l'image.
        await handleDownload();
        return;
      }

      await navWithShare.share(shareData);
    } catch {
      showToast("Partage impossible");
    } finally {
      setIsBusy(null);
    }
  }

  async function handleCopy() {
    setIsBusy("copy");
    try {
      const blob = await captureBlob();
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("Image copiée");
    } catch {
      showToast("Impossible de copier l'image");
    } finally {
      setIsBusy(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          className={["filtre-chip", format === "story" ? "actif" : ""].join(" ")}
          onClick={() => setFormat("story")}
        >
          Story 9:16
        </button>
        <button
          type="button"
          className={["filtre-chip", format === "post" ? "actif" : ""].join(" ")}
          onClick={() => setFormat("post")}
        >
          Post 1:1
        </button>
      </div>

      <div className="flex gap-2">
        {canNativeShare && (
          <Button
            variant="primaire"
            size="sm"
            onClick={handleShare}
            isLoading={isBusy === "share"}
            className="sm:hidden flex-1"
          >
            Partager
          </Button>
        )}
        <Button
          variant="secondaire"
          size="sm"
          onClick={handleDownload}
          isLoading={isBusy === "download"}
          className={canNativeShare ? "flex-1 sm:flex-none" : undefined}
        >
          Télécharger
        </Button>
        {canCopyImages && (
          <Button
            variant="discret"
            size="sm"
            onClick={handleCopy}
            isLoading={isBusy === "copy"}
          >
            Copier l'image
          </Button>
        )}
      </div>

      {/* Hors écran : jamais montré tel quel, seulement capturé en image. */}
      <div className="fixed -left-[9999px] top-0" aria-hidden="true">
        <ShareCard
          ref={cardRef}
          format={format}
          {...props}
          competitionLogoUrl={dataUrlOverrides?.competitionLogoUrl}
          homeTeamLogoUrl={dataUrlOverrides?.homeTeamLogoUrl}
          awayTeamLogoUrl={dataUrlOverrides?.awayTeamLogoUrl}
          sharedByDisplayName={myProfile?.display_name}
          sharedByAvatarUrl={myProfile?.avatar_url}
        />
      </div>
    </div>
  );
}

function homeAwaySlug(home: string, away: string): string {
  return `${home}-${away}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
