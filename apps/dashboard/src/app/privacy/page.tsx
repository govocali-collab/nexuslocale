import type { Metadata } from 'next';
import { LegalShell, type LegalContent } from '@/components/landing/legal-shell';

export const metadata: Metadata = {
  title: 'Confidentialité / Privacy Policy | NexusLocale',
  description: 'How NexusLocale collects, uses, and protects your information.',
};

const CONTENT: LegalContent = {
  fr: {
    title: 'Politique de confidentialité',
    updated: '26 juin 2026',
    sections: [
      { h: '1. Renseignements que nous recueillons', paras: ['Lorsque vous nous contactez via notre site web, nous recueillons les renseignements que vous fournissez, par exemple :'], bullets: ['Votre prénom et votre nom', 'Votre adresse courriel et votre numéro de téléphone', 'La raison de votre message et le message lui-même', 'Des données techniques de base, comme votre type de navigateur et les pages visitées'] },
      { h: '2. Comment nous utilisons vos renseignements', paras: ["Nous utilisons vos renseignements pour répondre à votre demande, fournir et améliorer nos services, vous envoyer l'information demandée et respecter nos obligations légales. Nous ne vendons pas vos renseignements personnels."] },
      { h: '3. Témoins (cookies) et analytique', paras: ["Nous pouvons utiliser des témoins (cookies) et des outils d'analyse pour comprendre comment les visiteurs utilisent notre site afin de l'améliorer. Vous pouvez contrôler les témoins dans les paramètres de votre navigateur."] },
      { h: '4. Comment nous partageons les renseignements', paras: ["Nous partageons les renseignements uniquement avec des fournisseurs de confiance qui nous aident à exploiter notre entreprise, comme notre fournisseur de courriel, notre hébergeur et nos plateformes de recherche et d'analyse. Ces fournisseurs ne peuvent utiliser vos renseignements que pour exécuter des services en notre nom."] },
      { h: '5. Conservation des données', paras: ['Nous conservons vos renseignements seulement le temps nécessaire pour vous répondre, fournir nos services et respecter la loi. Ensuite, nous les supprimons ou les anonymisons.'] },
      { h: '6. Vos droits', paras: ['En vertu des lois applicables sur la protection des renseignements personnels au Québec et au Canada, vous pouvez :'], bullets: ['Demander l’accès aux renseignements personnels que nous détenons à votre sujet', 'Demander la correction de renseignements inexacts', 'Demander la suppression de vos renseignements, sous réserve des limites légales', 'Retirer votre consentement en tout temps'] },
      { h: '7. Sécurité', paras: ["Nous prenons des mesures raisonnables pour protéger vos renseignements contre la perte, le vol et l'accès non autorisé. Aucune méthode de transmission sur Internet n'est entièrement sécuritaire, mais nous travaillons à garder vos données en sécurité."] },
      { h: '8. Modifications de la présente politique', paras: ['Nous pouvons mettre à jour cette politique de temps à autre. La version la plus récente sera toujours affichée sur cette page avec sa date de mise à jour.'] },
      { h: '9. Contact', paras: ['Des questions sur votre vie privée ? Écrivez-nous à support@nexuslocale.com.'] },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'June 26, 2026',
    sections: [
      { h: '1. Information we collect', paras: ['When you contact us through our website, we collect the information you provide, such as:'], bullets: ['Your first and last name', 'Your email address and phone number', 'The reason for your message and the message itself', 'Basic technical data such as your browser type and pages visited'] },
      { h: '2. How we use your information', paras: ['We use your information to respond to your inquiry, to provide and improve our services, to send you information you have requested, and to meet our legal obligations. We do not sell your personal information.'] },
      { h: '3. Cookies and analytics', paras: ['We may use cookies and analytics tools to understand how visitors use our website so we can improve it. You can control cookies through your browser settings.'] },
      { h: '4. How we share information', paras: ['We share information only with trusted service providers who help us run our business, such as our email provider, hosting provider, and search and analytics platforms. These providers may only use your information to perform services on our behalf.'] },
      { h: '5. Data retention', paras: ['We keep your information only as long as needed to respond to you, to provide our services, and to comply with the law. After that, we delete or anonymize it.'] },
      { h: '6. Your rights', paras: ['Under applicable Quebec and Canadian privacy law, you may:'], bullets: ['Ask to access the personal information we hold about you', 'Ask us to correct information that is inaccurate', 'Ask us to delete your information, subject to legal limits', 'Withdraw your consent at any time'] },
      { h: '7. Security', paras: ['We take reasonable measures to protect your information against loss, theft, and unauthorized access. No method of transmission over the internet is fully secure, but we work to keep your data safe.'] },
      { h: '8. Changes to this policy', paras: ['We may update this policy from time to time. The latest version will always be posted on this page with an updated date.'] },
      { h: '9. Contact', paras: ['Questions about your privacy? Reach us at support@nexuslocale.com.'] },
    ],
  },
};

export default function PrivacyPage() {
  return <LegalShell content={CONTENT} />;
}
