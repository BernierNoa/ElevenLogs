import { useState } from "react";
import { Link } from "react-router";
import { SignUp } from "@clerk/react-router";
import { Button } from "../components/ui/Button";

export function SignUpPage() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-noir px-5 gap-5">
      <div className="w-full max-w-[520px]">
        <div className="text-craie mb-6">
          <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] text-[26px] mb-2">
            Créer mon compte
          </h1>
          <p className="text-gris text-[14px] leading-relaxed">
            Le foot, loggé match par match. Note tes matchs, choisis l’homme du match,
            suis tes stats — et retrouve l’activité de tes amis.
          </p>
        </div>

        <div className="carte p-4 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-projecteur/10 border border-projecteur-fonce/50">
              <span className="text-projecteur font-display font-extrabold">EL</span>
            </div>
            <div className="min-w-0">
              <p className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.1em]">
                Pour lancer ta saison
              </p>
              <p className="text-[14px] text-craie mt-1">
                En 3 taps : trouver un match, l’enregistrer, puis partager ton MOTM.
              </p>
            </div>
          </div>

          <div className="relative">
            {/*
              On garde le formulaire Clerk (fiable, sécurisé), mais on empêche
              l’utilisateur de soumettre tant qu’il n’a pas accepté CGU + confidentialité.
            */}
            <div
              style={{
                pointerEvents: accepted ? "auto" : "none",
                opacity: accepted ? 1 : 0.55,
              }}
            >
              <SignUp routing="path" path="/inscription" signInUrl="/connexion" />
            </div>

            {!accepted && (
              <div className="absolute inset-0 z-10 rounded-lg border border-carton/40 bg-noir/80 flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-craie font-display font-bold text-[14px] mb-2">
                    Il manque un accord
                  </p>
                  <p className="text-gris-fonce text-[13px] mb-4">
                    Fais défiler juste en dessous pour accepter CGU + confidentialité.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-ligne">
            <div className="flex items-start gap-3">
              <input
                id="accept-cgu"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="accept-cgu" className="text-[13px] text-gris leading-relaxed">
                J’ai lu et j’accepte les{" "}
                <Link to="/cgu" className="text-projecteur hover:text-craie transition-colors">
                  CGU
                </Link>{" "}
                et la{" "}
                <Link
                  to="/confidentialite"
                  className="text-projecteur hover:text-craie transition-colors"
                >
                  politique de confidentialité
                </Link>{" "}
                d’Eleven Logs.
                <br />
                Je confirme aussi avoir <strong>au moins 15 ans</strong>.
              </label>
            </div>

            <p className="text-gris-fonce text-[12px] mt-3">
              Aucun lancement public sans ça : on le fait propre, dès le départ.
            </p>

            <div className="mt-4 flex gap-3 flex-wrap">
              <Button
                type="button"
                onClick={() => setAccepted(true)}
                variant="discret"
                size="sm"
                disabled={accepted}
              >
                J’ai compris, j’accepte
              </Button>
              <Link to="/cgu" className="text-projecteur text-[13px] hover:text-craie">
                Lire CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
