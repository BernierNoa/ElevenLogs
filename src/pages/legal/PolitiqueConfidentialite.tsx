import {
  LegalLayout,
  LegalSection,
  LegalDraftNotice,
} from "../../components/LegalLayout";

export function PolitiqueConfidentialite() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      updatedAt="24 juillet 2026"
    >
      <LegalDraftNotice />

      <LegalSection title="Responsable de traitement">
        <p>
          Le responsable du traitement des données à caractère personnel
          collectées sur Eleven Logs est Noa Bernier, contact :
          contact@elevenlogs.app.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>
          <strong className="text-craie">Compte</strong> — adresse email et,
          le cas échéant, nom et photo de profil, gérés par notre
          prestataire d'authentification Clerk, Inc.
        </p>
        <p>
          <strong className="text-craie">Contenu que tu publies</strong> —
          les matchs que tu notes (note sur 10, homme du match choisi,
          commentaire facultatif), la date de visionnage, et le réglage de
          visibilité (public/privé) que tu choisis pour chaque log et pour
          ton profil.
        </p>
        <p>
          <strong className="text-craie">Données sociales</strong> — les
          comptes que tu suis, ceux qui te suivent, les comptes que tu
          bloques, et les signalements que tu effectues.
        </p>
        <p>
          <strong className="text-craie">Données techniques</strong> —
          l'adresse IP et les informations standard de connexion, journalisées
          par nos hébergeurs à des fins de sécurité. Un cookie de session,
          strictement nécessaire au fonctionnement du compte, est déposé par
          Clerk pour te maintenir connecté.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le Service n'utilise aujourd'hui aucun cookie de mesure d'audience
          ni de publicité — uniquement le cookie de session strictement
          nécessaire à l'authentification, qui ne requiert pas de recueil de
          consentement au sens de la réglementation applicable (CNIL). Si un
          outil de mesure d'audience ou de suivi venait à être ajouté, cette
          page serait mise à jour et un bandeau de consentement serait mis en
          place au préalable.
        </p>
      </LegalSection>

      <LegalSection title="Finalités et bases légales">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Fournir le Service (création de compte, enregistrement des logs,
            calcul des statistiques) — exécution du contrat.
          </li>
          <li>
            Assurer la sécurité du Service et la modération des contenus
            signalés — intérêt légitime.
          </li>
          <li>
            Afficher les comparaisons communautaires et le fil d'activité, en
            fonction des réglages de visibilité choisis par chaque
            utilisateur — exécution du contrat.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Destinataires et sous-traitants">
        <p>
          Tes données sont hébergées et traitées par les prestataires
          suivants, dans le cadre de l'exécution du Service :
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-craie">Supabase</strong> (base de données
            et fonctions serveur) — Supabase Pte. Ltd., Singapour. Un accord
            de traitement des données (DPA) est disponible sur{" "}
            <a href="https://supabase.com/legal/dpa" className="text-projecteur">
              supabase.com/legal/dpa
            </a>
            .
          </li>
          <li>
            <strong className="text-craie">Clerk</strong> (authentification et
            gestion des comptes) — Clerk, Inc., États-Unis. Voir{" "}
            <a href="https://clerk.com/legal/privacy" className="text-projecteur">
              clerk.com/legal/privacy
            </a>
            .
          </li>
          <li>
            <strong className="text-craie">Oracle Corporation</strong>{" "}
            (hébergement du frontend) — États-Unis.
          </li>
        </ul>
        <p>
          Certains de ces prestataires étant situés hors de l'Union
          européenne, ces transferts sont encadrés contractuellement
          (clauses contractuelles types de la Commission européenne). Tes
          données ne sont ni vendues, ni utilisées à des fins publicitaires.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Tes données sont conservées tant que ton compte est actif. En cas
          de suppression de ton compte, tes logs, tes relations de suivi et
          ton profil sont effacés ; les signalements que tu as émis peuvent
          être conservés de façon anonymisée à des fins de modération.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          L'accès à tes données est contrôlé au niveau de la base de données
          (règles de sécurité par ligne / Row Level Security), qui garantit
          qu'un utilisateur ne peut lire les logs privés d'un autre compte,
          quelle que soit la façon dont la requête est formulée.
        </p>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Conformément au RGPD, tu disposes d'un droit d'accès, de
          rectification, d'effacement, de limitation, d'opposition et de
          portabilité sur tes données. Tu peux exercer ces droits en écrivant
          à contact@elevenlogs.app, ou directement en supprimant ton compte
          depuis ton profil.
        </p>
        <p>
          Tu peux également introduire une réclamation auprès de la CNIL (3
          Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{" "}
          <a href="https://www.cnil.fr" className="text-projecteur">
            cnil.fr
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Mineurs">
        <p>
          Le Service est réservé aux personnes âgées d'au moins 15 ans, sauf
          autorisation d'un titulaire de l'autorité parentale, conformément
          aux{" "}
          <a href="/cgu" className="text-projecteur">
            CGU
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
