import { useNavigate } from "react-router";
import { Button } from "../ui/Button";

export function LandingFinalCta() {
  const navigate = useNavigate();

  return (
    <section className="relative max-w-[1180px] mx-auto px-5 md:px-8 py-16 md:py-24 border-t border-ligne text-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-[0.1] blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, var(--color-projecteur), transparent 65%)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <h2 className="font-display font-extrabold [font-stretch:110%] text-[26px] md:text-[34px] leading-[1.1] tracking-[-0.02em] max-w-[20ch] mx-auto">
          Le prochain coup de sifflet arrive vite.
        </h2>
        <p className="text-gris text-[15px] mt-3.5 max-w-[42ch] mx-auto">
          Rejoins Eleven Logs et ne laisse plus un seul grand match filer
          sans trace.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-7">
          <Button onClick={() => navigate("/inscription")}>
            Commence à logger
          </Button>
          <Button
            variant="secondaire"
            onClick={() => navigate("/connexion")}
          >
            Se connecter
          </Button>
        </div>
      </div>
    </section>
  );
}
