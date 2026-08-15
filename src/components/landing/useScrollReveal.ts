import { useEffect, useRef, useState } from "react";

/**
 * Reveal léger au scroll (fade + slide) sans dépendance externe. Se
 * déclenche une seule fois — pas de va-et-vient en scrollant. Sous
 * `prefers-reduced-motion`, la transition est déjà neutralisée globalement
 * (index.css), donc l'élément apparaît directement dans son état final.
 */
export function useScrollReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
