import {
  LegalLayout,
  LegalSection,
  LegalDraftNotice,
} from "../../components/LegalLayout";

export function CGU() {
  return (
    <LegalLayout
      title="Conditions Générales d'Utilisation"
      updatedAt="18 août 2026"
    >
      <LegalDraftNotice />

      <LegalSection title="1. Objet">
        <p>
          Les présentes Conditions Générales d'Utilisation (« CGU ») régissent
          l'accès et l'utilisation du service Eleven Logs (« le Service »),
          qui permet à un utilisateur de noter les matchs de football qu'il a
          regardés — y compris des matchs personnalisés ou des multiplex
          absents du référentiel du Service —, d'élire un homme du match, de
          consulter ses statistiques de saison, de suivre l'activité d'autres
          utilisateurs et de partager ses avis, y compris sous forme d'image
          générée pour les réseaux sociaux. L'accès au Service implique
          l'acceptation pleine et entière des présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="2. Création de compte">
        <p>
          La création d'un compte requiert une adresse email valide. Le
          Service est destiné aux personnes âgées d'au moins 15 ans ; en deçà,
          la création d'un compte nécessite l'autorisation d'un titulaire de
          l'autorité parentale.
        </p>
        <p>
          L'utilisateur est responsable de la confidentialité de ses
          identifiants et de toute activité effectuée depuis son compte.
        </p>
      </LegalSection>

      <LegalSection title="3. Fonctionnement du Service">
        <p>
          Pour chaque match, l'utilisateur peut enregistrer une note sur 10
          (y compris en demi-points), désigner un homme du match parmi les
          joueurs de la composition quand elle est disponible, et ajouter un
          commentaire facultatif (« un log »). Lorsqu'un match ne figure pas
          dans le référentiel du Service (rencontre amateur, multiplex de
          plusieurs matchs suivis le même soir...), l'utilisateur peut créer
          un « match personnalisé » en saisissant librement son intitulé.
          Ces logs alimentent des statistiques personnelles (moyenne, séries,
          classements par compétition/équipe/joueur) et, selon leur
          visibilité, peuvent être comparés à la moyenne de la communauté.
        </p>
        <p>
          Chaque log est associé à un réglage de visibilité (public ou privé)
          défini par l'utilisateur, et chaque profil peut lui-même être
          public ou privé. Un profil privé n'est visible que par son
          propriétaire, y compris pour les comptes qui le suivent ; un log
          marqué privé n'apparaît jamais dans les fils d'un autre utilisateur,
          même sur un profil par ailleurs public.
        </p>
        <p>
          Le Service propose une fonctionnalité de suivi entre comptes (sans
          validation préalable du compte suivi), un fil d'activité affichant
          les logs récents des comptes suivis, ainsi que la possibilité
          d'aimer et de commenter les avis visibles par l'utilisateur. Le nom
          et la photo de profil d'un utilisateur restent visibles
          publiquement même si son profil est réglé sur privé, afin de
          permettre la recherche et le suivi de comptes.
        </p>
        <p>
          Le Service peut, sous réserve de l'accord de l'utilisateur donné au
          moment de l'activation, envoyer des notifications (nouvel abonné,
          « j'aime » reçu...) sous forme de notification push directement sur
          l'appareil de l'utilisateur. Cette fonctionnalité est facultative
          et peut être désactivée à tout moment au niveau du navigateur ou du
          système d'exploitation.
        </p>
      </LegalSection>

      <LegalSection title="4. Contenu utilisateur">
        <p>
          L'utilisateur reste titulaire des droits sur les notes, commentaires
          et matchs personnalisés qu'il publie. En les publiant sur le
          Service, il accorde à l'éditeur une licence non exclusive, gratuite
          et limitée à la durée de conservation du contenu, permettant son
          affichage sur le Service conformément au réglage de visibilité
          choisi (y compris dans un fil d'activité, une comparaison
          communautaire agrégée, ou une image générée pour être partagée par
          l'utilisateur lui-même en dehors du Service).
        </p>
        <p>
          L'utilisateur s'engage à ne publier aucun contenu illicite,
          diffamatoire, injurieux, ou portant atteinte aux droits d'un tiers.
        </p>
      </LegalSection>

      <LegalSection title="5. Signalement, blocage et modération">
        <p>
          Un utilisateur peut signaler un log qu'il estime contraire aux
          présentes CGU ; ce signalement est examiné manuellement par
          l'éditeur, aucun contenu n'est retiré ou traité de façon
          automatisée sur la seule base d'un signalement.
        </p>
        <p>
          Un utilisateur peut également bloquer un autre compte : le compte
          bloqué ne peut alors plus suivre le bloqueur ni voir ses logs
          publics, dans les deux sens.
        </p>
        <p>
          En cas de manquement aux présentes CGU, l'éditeur peut, de façon
          proportionnée à la gravité des faits, retirer un contenu, suspendre
          temporairement un compte pour une durée déterminée, ou le bannir
          définitivement. Un compte suspendu ou banni conserve l'accès en
          lecture à son historique mais ne peut plus créer de nouveau log
          pendant la durée de la sanction. L'utilisateur peut contester une
          décision de modération en écrivant à contact@elevenlogs.app.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilité et données sportives">
        <p>
          Les données relatives aux matchs, compétitions, équipes et
          compositions proviennent de fournisseurs tiers et sont fournies à
          titre indicatif. L'éditeur ne garantit pas leur exactitude ni leur
          exhaustivité et ne saurait être tenu responsable d'une erreur ou
          d'un retard dans leur mise à jour.
        </p>
        <p>
          L'éditeur s'efforce d'assurer la disponibilité du Service mais
          n'offre aucune garantie de continuité de service et ne saurait être
          tenu responsable d'une interruption, temporaire ou prolongée.
        </p>
      </LegalSection>

      <LegalSection title="7. Résiliation">
        <p>
          L'utilisateur peut demander la suppression de son compte à tout
          moment en écrivant à contact@elevenlogs.app. La suppression
          entraîne l'effacement de son compte et de ses logs, conformément à
          la{" "}
          <a href="/confidentialite" className="text-projecteur">
            politique de confidentialité
          </a>
          . Une fonctionnalité de suppression directement accessible depuis
          le profil est prévue ; en attendant sa mise en place, la demande
          par email est traitée dans les meilleurs délais.
        </p>
      </LegalSection>

      <LegalSection title="8. Modification des CGU">
        <p>
          L'éditeur peut modifier les présentes CGU à tout moment. La version
          en vigueur est celle publiée sur cette page, avec sa date de
          dernière mise à jour.
        </p>
      </LegalSection>

      <LegalSection title="9. Droit applicable">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de
          litige, les parties s'efforcent de trouver une solution amiable
          avant toute action judiciaire. À défaut, et conformément aux
          règles protectrices applicables aux consommateurs, l'utilisateur
          peut saisir la juridiction de son propre lieu de résidence ou celle
          du ressort d'Amiens, lieu de résidence de l'éditeur.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
