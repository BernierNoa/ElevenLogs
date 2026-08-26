import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { useSession } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { ShareCard, type ShareCardProps, type ShareFormat } from "./ShareCard";
import { showToast } from "../lib/toastStore";
import { proxiedImageUrl } from "../lib/imageProxy";

export interface ShareExporterProps {
  /** Tout ce qu'affiche ShareCard, sauf `format` (piloté par le toggle
   * story/post interne). Partagé entre ShareLogButton (log personnel) et
   * AdminStoryGenerator (récap communautaire) : seul le contenu diffère. */
  cardProps: Omit<ShareCardProps, "format">;
  /** Base du nom de fichier téléchargé, ex. "psg-om" — cf. homeAwaySlug. */
  filenameBase: string;
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

// Extrait de ShareLogButton (implémentation d'origine) pour être réutilisé
// tel quel par AdminStoryGenerator — seul le contenu de la carte change
// entre un log personnel et un récap communautaire, jamais le mécanisme de
// capture/téléchargement/partage.
export function ShareExporter({ cardProps, filenameBase }: ShareExporterProps) {
  const [format, setFormat] = useState<ShareFormat>("story");
  const [isBusy, setIsBusy] = useState<"download" | "copy" | "share" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { session } = useSession();
  const didToastProxyErrorRef = useRef(false);

  const [dataUrlOverrides, setDataUrlOverrides] = useState<{
    competitionLogoUrl: string | null;
    homeTeamLogoUrl: string | null;
    awayTeamLogoUrl: string | null;
  } | null>(null);

  async function blobToDataUrl(blob: Blob): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_blob_failed"));
      reader.onloadend = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  }

  async function fetchImageAsDataUrl(sourceUrl: string | null | undefined) {
    if (!sourceUrl) return null;
    if (sourceUrl.startsWith("data:")) return sourceUrl;

    const proxied = proxiedImageUrl(sourceUrl);
    if (!proxied) return null;

    const token = (await session?.getToken()) ?? null;
    if (!token) return null;

    const res = await fetch(proxied, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (!didToastProxyErrorRef.current) {
        didToastProxyErrorRef.current = true;
        showToast(`Logos : image-proxy a échoué (HTTP ${res.status}).`);
      }
      return null;
    }

    const blob = await res.blob();
    return await blobToDataUrl(blob);
  }

  async function captureBlob(): Promise<Blob | null> {
    if (!cardRef.current) return null;

    if (session) {
      didToastProxyErrorRef.current = false;
      try {
        const [competition, home, away] = await Promise.all([
          fetchImageAsDataUrl(cardProps.competitionLogoUrl),
          fetchImageAsDataUrl(cardProps.homeTeamLogoUrl),
          fetchImageAsDataUrl(cardProps.awayTeamLogoUrl),
        ]);

        setDataUrlOverrides({
          competitionLogoUrl: competition,
          homeTeamLogoUrl: home,
          awayTeamLogoUrl: away,
        });

        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      } catch {
        // fallback : on garde les URLs originales
      }
    }

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
      link.download = `eleven-logs-${format}-${filenameBase}.png`;
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

      const file = new File([blob], `eleven-logs-${format}-${filenameBase}.png`, {
        type: "image/png",
      });

      type ShareDataWithFiles = { title?: string; text?: string; files?: File[] };

      const shareData: ShareDataWithFiles = {
        title: "Eleven Logs",
        text: "Eleven Logs",
        files: [file],
      };

      const navWithShare = navigator as Navigator & {
        share: (data: ShareDataWithFiles) => Promise<void>;
        canShare?: (data: ShareDataWithFiles) => boolean;
      };

      if (typeof navWithShare.canShare === "function" && !navWithShare.canShare(shareData)) {
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
          <Button variant="discret" size="sm" onClick={handleCopy} isLoading={isBusy === "copy"}>
            Copier l'image
          </Button>
        )}
      </div>

      {/* Hors écran : jamais montré tel quel, seulement capturé en image. */}
      <div className="fixed -left-[9999px] top-0" aria-hidden="true">
        <ShareCard
          ref={cardRef}
          format={format}
          {...cardProps}
          competitionLogoUrl={dataUrlOverrides?.competitionLogoUrl ?? cardProps.competitionLogoUrl}
          homeTeamLogoUrl={dataUrlOverrides?.homeTeamLogoUrl ?? cardProps.homeTeamLogoUrl}
          awayTeamLogoUrl={dataUrlOverrides?.awayTeamLogoUrl ?? cardProps.awayTeamLogoUrl}
        />
      </div>
    </div>
  );
}
