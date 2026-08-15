import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="border-t border-ligne px-5 md:px-8 py-5 mt-auto">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-data text-[10.5px] text-gris-fonce uppercase tracking-[0.06em]">
        <Link to="/mentions-legales" className="hover:text-craie transition-colors">
          Mentions légales
        </Link>
        <Link to="/cgu" className="hover:text-craie transition-colors">
          CGU
        </Link>
        <Link to="/confidentialite" className="hover:text-craie transition-colors">
          Confidentialité
        </Link>
      </div>
    </footer>
  );
}
