import { Link } from "react-router";
import { SignIn as ClerkSignIn } from "@clerk/react-router";

export function Connexion() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-noir px-5 gap-5">
      <div className="w-full max-w-[520px]">
        <div className="text-craie mb-6">
          <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] text-[26px] mb-2">
            Revenir sur Eleven Logs
          </h1>
          <p className="text-gris text-[14px] leading-relaxed">
            Connecte-toi pour retrouver ton journal, tes stats de saison et
            l’activité de tes amis.
          </p>
        </div>

        <div className="carte p-4 sm:p-6">
          <div className="mb-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center bg-projecteur/10 border border-projecteur-fonce/50">
                <span className="text-projecteur font-display font-extrabold">
                  EL
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.1em]">
                  En 30 secondes
                </p>
                <p className="text-[14px] text-craie mt-1">
                  1) loggue un match
                  <br />
                  2) vois ton journal & tes stats
                  <br />
                  3) partage ton MOTM
                </p>
              </div>
            </div>

            <p className="text-gris-fonce text-[12.5px]">
              Astuce : tes contenus se mettent à jour même si tu es parfois
              hors-ligne.
            </p>
          </div>

          <div
            style={{
              // éviter que Clerk fasse clignoter des layouts par-dessus
              // notre conteneur
              width: "100%",
            }}
          >
            <ClerkSignIn routing="path" path="/connexion" signUpUrl="/inscription" />
          </div>

          <div className="mt-5 pt-4 border-t border-ligne">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <p className="text-gris-fonce text-[12.5px]">
                Nouveau ici ?
              </p>
              <Link to="/inscription" className="text-projecteur hover:text-craie transition-colors font-semibold">
                Créer un compte
              </Link>
            </div>

            <p className="text-gris-fonce text-[11.5px] text-center max-w-[320px] mt-3 mx-auto">
              En continuant, tu acceptes les{" "}
              <Link to="/cgu" className="text-projecteur">
                CGU
              </Link>{" "}
              et la{" "}
              <Link to="/confidentialite" className="text-projecteur">
                politique de confidentialité
              </Link>{" "}
              d'Eleven Logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
