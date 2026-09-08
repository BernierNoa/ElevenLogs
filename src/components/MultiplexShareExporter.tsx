import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { useSession } from "@clerk/react-router";
import { Button } from "./ui/Button";
import {
  MultiplexShareCard,
  type MultiplexShareCardProps,
  type MultiplexShareMatch,
} from "./MultiplexShareCard";
import { type ShareFormat } from "./ShareCard";
import { showToast } from "../lib/toastStore";
import { proxiedImageUrl } from "../lib/imageProxy";

export interface MultiplexShareExporterProps {
  cardProps: Omit<MultiplexShareCardProps, "format">;
  /** Base du nom de fichier téléchargé, ex. "multiplex-3-matchs". */
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

// Pendant de ShareExporter pour un multiplex : même capture html-to-image et
// mêmes actions (télécharger/partager/copier), mais le proxy d'images doit
// couvrir un nombre variable de blasons (home+away de chaque match) plutôt
// que trois logos fixes.
export function MultiplexShareExporter({ cardProps, filenameBase }: MultiplexShareExporterProps) {
  const [format, setFormat] = useState<ShareFormat>("story");
  const [isBusy, setIsBusy] = useState<"download" | "copy" | "share" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { session } = useSession();
  const didToastProxyErrorRef = useRef(false);

  const [matchOverrides, setMatchOverrides] = useState<MultiplexShareMatch[] | null>(null);

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
        // Un même blason (logo d'équipe) peut revenir sur plusieurs matchs du
        // multiplex — on ne le télécharge qu'une fois via ce cache.
        const cache = new Map<string, string | null>();
        async function resolve(url: string | null | undefined): Promise<string | null> {
          if (!url) return null;
          if (!cache.has(url)) cache.set(url, await fetchImageAsDataUrl(url));
          return cache.get(url) ?? null;
        }

        const resolved = await Promise.all(
          cardProps.matches.map(async (match) => ({
            ...match,
            homeTeamLogoUrl: (await resolve(match.homeTeamLogoUrl)) ?? match.homeTeamLogoUrl,
            awayTeamLogoUrl: (await resolve(match.awayTeamLogoUrl)) ?? match.awayTeamLogoUrl,
          })),
        );

        setMatchOverrides(resolved);

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
        <MultiplexShareCard
          ref={cardRef}
          format={format}
          {...cardProps}
          matches={matchOverrides ?? cardProps.matches}
        />
      </div>
    </div>
  );
}
