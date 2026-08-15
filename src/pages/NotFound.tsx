import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-16 text-center">
      <div className="chiffres font-display font-black [font-stretch:118%] text-[64px] text-projecteur leading-none">
        404
      </div>
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[22px] mt-4">
        Cette page n'existe pas
      </h1>
      <p className="text-gris text-[13.5px] mt-2 max-w-[46ch] mx-auto">
        Le lien est peut-être cassé, ou la page a été déplacée.
      </p>
      <Button className="mt-6" onClick={() => navigate("/")}>
        Retour à l'accueil
      </Button>
    </div>
  );
}
