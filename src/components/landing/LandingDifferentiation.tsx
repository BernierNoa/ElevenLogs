import type { ComponentType } from "react";
import { IconStats, IconActivite } from "../icons";

interface DiffCard {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  gold?: boolean;
}

const CARDS: DiffCard[] = [
  {
    title: "Historique de saison",
    description:
      "Chaque match noté nourrit tes stats : équipe préférée, joueur le plus souvent élu MOTM, ta moyenne du mois.",
    icon: IconStats,
  },
  {
    title: "Comparaison avec tes amis",
    description:
      "Vois ce que tes amis ont pensé du même match, juste à côté de ta note.",
    icon: IconActivite,
  },
  {
    title: "Badges MOTM communautaires",
    description:
      "Le vrai homme du match, décidé par tous les logs de la communauté — pas juste par les journalistes.",
    icon: IconActivite,
    gold: true,
  },
];

export function LandingDifferentiation() {
  return (
    <section className="max-w-[1180px] mx-auto px-5 md:px-8 py-14 md:py-20 border-t border-ligne">
      <span className="font-data text-[11px] tracking-[0.14em] uppercase text-projecteur">
        Pourquoi pas juste dans ta tête
      </span>
      <h2 className="font-display font-extrabold [font-stretch:110%] text-[24px] md:text-[30px] leading-[1.1] tracking-[-0.02em] mt-2 max-w-[28ch]">
        Ta mémoire oublie. Ton appli Notes aussi.
      </h2>

      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {CARDS.map((card) => (
          <div key={card.title} className="carte p-5">
            <span
              className={
                "inline-flex w-9 h-9 rounded-[10px] items-center justify-center border " +
                (card.gold
                  ? "border-motm-gold/40 bg-motm-gold/10 text-motm-gold"
                  : "border-projecteur-fonce/40 bg-projecteur/10 text-projecteur")
              }
            >
              {card.gold ? (
                <span aria-hidden="true" className="text-[15px] leading-none">◆</span>
              ) : (
                <card.icon className="w-4.5 h-4.5" />
              )}
            </span>
            <h3 className="font-display font-bold text-[15px] mt-3.5">
              {card.title}
            </h3>
            <p className="text-gris-fonce text-[13px] mt-1.5 leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
