import {
  LegalLayout,
  LegalSection,
  LegalDraftNotice,
} from "../../components/LegalLayout";

export function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="18 août 2026">
      <LegalDraftNotice />

      <LegalSection title="Éditeur du site">
        <p>
          Le site Eleven Logs (ci-après « le Site ») est édité par Noa
          Bernier, à titre non professionnel (particulier).
          <br />
          Email de contact : contact@elevenlogs.app
        </p>
        <p>
          Conformément à l'article 6-III de la loi n° 2004-575 du 21 juin
          2004 pour la confiance dans l'économie numérique, un éditeur
          agissant à titre non professionnel peut ne pas rendre son adresse
          personnelle publique, à condition de l'avoir communiquée à son
          hébergeur — c'est le cas ici. Cette adresse reste transmissible aux
          autorités judiciaires sur demande. Ce point sera revu si le Site
          venait à être exploité dans un cadre commercial ou par une société
          déclarée.
        </p>
        <p>Directeur de la publication : Noa Bernier.</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le frontend du Site (interface visitée dans le navigateur) est
          hébergé par :
          <br />
          Oracle Corporation, 500 Oracle Parkway, Redwood City, CA 94065,
          États-Unis.
        </p>
        <p>
          La base de données et les fonctions serveur sont hébergées par
          Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre,
          Singapore 049513 —{" "}
          <a href="https://supabase.com/privacy" className="text-projecteur">
            supabase.com/privacy
          </a>{" "}
          (adresse à vérifier périodiquement sur cette page, une société peut
          déménager).
        </p>
        <p>
          L'authentification et la gestion des comptes utilisateurs sont
          assurées par Clerk, Inc. (société de droit américain) —{" "}
          <a href="https://clerk.com/legal/privacy" className="text-projecteur">
            clerk.com/legal/privacy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          La structure du Site, son design, ses textes, logos et éléments
          graphiques sont, sauf mention contraire, la propriété de l'éditeur
          et protégés par le droit d'auteur. Les données relatives aux
          compétitions, équipes, matchs et joueurs proviennent de sources
          tierces référencées à des fins d'information sportive.
        </p>
        <p>
          Les contenus publiés par les utilisateurs (notes, commentaires,
          sélections d'homme du match) restent la propriété de leurs
          auteurs, qui accordent à l'éditeur une licence d'affichage sur le
          Site dans les conditions décrites dans les{" "}
          <a href="/cgu" className="text-projecteur">
            Conditions Générales d'Utilisation
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question relative au Site, à ses mentions légales ou à
          un signalement, contact : contact@elevenlogs.app.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
