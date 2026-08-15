import { useEffect, useRef, useState } from "react";
import { abbreviateTeamName } from "../lib/teamAbbreviation";

export interface TeamNameProps {
  name: string;
  className?: string;
}

// Tooltip custom plutôt que `title` natif : peu fiable au tactile (pas de
// long-press garanti selon navigateur). Abrège intelligemment (3 lettres
// façon code FIFA, cf. teamAbbreviation.ts) plutôt que de laisser le CSS
// couper le nom au milieu d'un mot, uniquement quand ça déborde vraiment.
export function TeamName({ name, className }: TeamNameProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollWidth > el.clientWidth);
  }, [name]);

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <span
      className={`relative inline-block min-w-0 ${className ?? ""}`}
      onMouseEnter={() => isOverflowing && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => {
        if (!isOverflowing) return;
        longPressTimer.current = setTimeout(() => setShowTooltip(true), 500);
      }}
      onTouchMove={clearLongPress}
      onTouchEnd={() => {
        clearLongPress();
        setShowTooltip(false);
      }}
    >
      <span ref={textRef} className="block truncate">
        {isOverflowing ? abbreviateTeamName(name) : name}
      </span>

      {showTooltip && (
        <span className="absolute left-0 bottom-full mb-1.5 z-20 whitespace-nowrap bg-nuit-haute border border-ligne rounded-md px-2 py-1 text-[12px] text-craie shadow-lg">
          {name}
        </span>
      )}
    </span>
  );
}
