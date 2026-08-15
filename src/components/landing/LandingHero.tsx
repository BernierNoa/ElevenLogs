import { useNavigate } from "react-router";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { LedRatingBar } from "../LedRatingBar";

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="relative max-w-[1180px] mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-14 md:pb-20 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-24 right-0 w-[420px] h-[420px] rounded-full opacity-[0.14] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-projecteur), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <span className="font-data text-[11px] tracking-[0.14em] uppercase text-projecteur">
            Ton journal de spectateur
          </span>
          <h1 className="font-display font-extrabold [font-stretch:110%] text-[34px] md:text-[46px] leading-[1.03] tracking-[-0.03em] mt-3">
            Chaque match non loggé
            <br />
            est un souvenir perdu.
          </h1>
          <p className="text-gris text-[15px] md:text-[16px] mt-4 max-w-[46ch]">
            Eleven Logs, c'est ta mémoire de supporter : une note sur 10, un
            homme du match, un mot sur ce que tu as vu — en 3 taps, pas plus.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Button onClick={() => navigate("/inscription")}>Commence à logger</Button>
            <Button variant="secondaire" onClick={() => navigate("/connexion")}>
              Se connecter
            </Button>
          </div>
        </div>

        <div className="carte p-5 relative">
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mb-3">
            Loggé il y a 2 min
          </div>
          <Badge variant="comp">UEFA Champions League</Badge>
          <div className="font-display font-bold [font-stretch:104%] text-[17px] mt-2.5">
            Real Madrid
            <span className="chiffres text-gris-fonce mx-1.5">4–3</span>
            Bayern Munich
          </div>
          <div className="mt-4">
            <LedRatingBar value={9} />
          </div>
          <div className="mt-4">
            <Badge variant="motm">◆ Homme du match — Vinícius Júnior</Badge>
          </div>
          <p className="quote mt-4">
            Match complètement fou, le meilleur que j'ai vu cette saison.
          </p>
        </div>
      </div>
    </section>
  );
}
