import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Button } from "./ui/Button";
import { StatsShareCard, type StatsShareCardProps } from "./StatsShareCard";
import { type ShareFormat } from "./ShareCard";
import { showToast } from "../lib/toastStore";

export interface StatsShareExporterProps {
  cardProps: Omit<StatsShareCardProps, "format">;
  /** Base du nom de fichier téléchargé, ex. "noa-24". */
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

// Même mécanique de capture/téléchargement/partage que ShareExporter (le
// récap de match), mais sans son étape de proxy des blasons : l'avatar Clerk
// est la seule image de cette carte et se lit directement par html-to-image
// (CORS ouvert), donc pas besoin de la faire transiter par image-proxy.
export function StatsShareExporter({ cardProps, filenameBase }: StatsShareExporterProps) {
  const [format, setFormat] = useState<ShareFormat>("story");
  const [isBusy, setIsBusy] = useState<"download" | "copy" | "share" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  async function captureBlob(): Promise<Blob | null> {
    if (!cardRef.current) return null;
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
      link.download = `eleven-logs-stats-${format}-${filenameBase}.png`;
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

      const file = new File([blob], `eleven-logs-stats-${format}-${filenameBase}.png`, {
        type: "image/png",
      });

      type ShareDataWithFiles = { title?: string; text?: string; files?: File[] };

      const shareData: ShareDataWithFiles = {
        title: "Eleven Logs",
        text: "Ma saison sur Eleven Logs",
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
        <StatsShareCard ref={cardRef} format={format} {...cardProps} />
      </div>
    </div>
  );
}
