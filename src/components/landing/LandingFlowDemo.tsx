import type { ReactNode } from "react";
import { Badge } from "../ui/Badge";
import { LedRatingBar } from "../LedRatingBar";
import { useScrollReveal } from "./useScrollReveal";

interface Step {
  number: string;
  title: string;
  content: ReactNode;
}

const STEPS: Step[] = [
  {
    number: "1",
    title: "Tape sur le match",
    content: (
      <div className="carte p-4">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em]">
            Terminé
          </span>
          <Badge variant="comp">Ligue 1</Badge>
        </div>
        <div className="font-display font-bold [font-stretch:104%] text-[14.5px] mb-3">
          PSG <span className="chiffres text-gris-fonce mx-1">3–1</span> OM
        </div>
        <span className="btn btn-primaire btn-sm pointer-events-none">
          Noter ce match
        </span>
      </div>
    ),
  },
  {
    number: "2",
    title: "Glisse ta note",
    content: (
      <div className="carte p-4">
        <LedRatingBar value={8} />
      </div>
    ),
  },
  {
    number: "3",
    title: "Élis ton homme du match (ou pas) et enregistre",
    content: (
      <div className="carte p-4 flex items-center justify-between gap-3 flex-wrap">
        <Badge variant="motm">◆ Dembélé</Badge>
        <span className="btn btn-primaire btn-sm pointer-events-none">
          Enregistrer
        </span>
      </div>
    ),
  },
];

function FlowStep({ step, index }: { step: Step; index: number }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="transition-all duration-500 ease-out"
      style={{
        transitionDelay: `${index * 120}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(16px)",
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="font-data text-[12px] font-bold text-projecteur border border-projecteur-fonce rounded-full w-6 h-6 grid place-items-center shrink-0">
          {step.number}
        </span>
        <h3 className="font-display font-bold text-[14.5px]">{step.title}</h3>
      </div>
      {step.content}
    </div>
  );
}

export function LandingFlowDemo() {
  return (
    <section className="max-w-[1180px] mx-auto px-5 md:px-8 py-14 md:py-20 border-t border-ligne">
      <span className="font-data text-[11px] tracking-[0.14em] uppercase text-projecteur">
        Comment ça marche
      </span>
      <h2 className="font-display font-extrabold [font-stretch:110%] text-[24px] md:text-[30px] leading-[1.1] tracking-[-0.02em] mt-2 max-w-[26ch]">
        Le coup de sifflet vient de retentir. Voilà tout ce qu'il te reste à
        faire.
      </h2>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {STEPS.map((step, index) => (
          <FlowStep key={step.number} step={step} index={index} />
        ))}
      </div>

      <p className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.1em] mt-8 text-center">
        Trois taps. Dix secondes. Zéro friction.
      </p>
    </section>
  );
}
