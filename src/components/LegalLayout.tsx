import type { ReactNode } from "react";
import { Link } from "react-router";

export interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalLayout({ title, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="max-w-[760px] mx-auto px-5 md:px-8 py-10">
      <nav className="flex gap-3 mb-6 text-[12px]">
        <Link to="/mentions-legales" className="text-gris-fonce hover:text-projecteur transition-colors">
          Mentions légales
        </Link>
        <span className="text-ligne">·</span>
        <Link to="/cgu" className="text-gris-fonce hover:text-projecteur transition-colors">
          CGU
        </Link>
        <span className="text-ligne">·</span>
        <Link to="/confidentialite" className="text-gris-fonce hover:text-projecteur transition-colors">
          Confidentialité
        </Link>
      </nav>

      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[26px] md:text-[30px]">
        {title}
      </h1>
      <p className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.08em] mt-2">
        Dernière mise à jour : {updatedAt}
      </p>

      <div className="mt-8 space-y-7 text-gris text-[14px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold text-craie text-[16px] mb-2.5">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

// Champ dont la valeur réelle (identité, adresse, SIRET…) doit être fournie
// par l'exploitant du site — ne jamais remplacer par une valeur inventée.
export function LegalPlaceholder({ children }: { children: ReactNode }) {
  return <span className="text-carton font-semibold">[{children}]</span>;
}

// Anciennement un bandeau "Brouillon" en rouge : le texte a depuis été
// complété pour refléter fidèlement les fonctionnalités réelles du Service
// (modération, notifications, matchs personnalisés...). La mention "ceci
// n'est pas un conseil juridique" reste standard sur ce type de page, même
// une fois le contenu abouti — ce n'est plus un aveu d'inachèvement, juste
// la réserve habituelle.
export function LegalDraftNotice() {
  return (
    <div className="carte border-ligne p-4 text-[13px] text-gris-fonce">
      Ce document ne constitue pas un conseil juridique. Il a été rédigé avec
      soin pour refléter le fonctionnement réel du Service ; une relecture
      par un professionnel du droit reste recommandée, notamment avant toute
      exploitation commerciale à plus grande échelle.
    </div>
  );
}
