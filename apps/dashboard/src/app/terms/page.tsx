import type { Metadata } from 'next';
import { LegalShell, type LegalContent } from '@/components/landing/legal-shell';

export const metadata: Metadata = {
  title: 'Conditions / Terms of Service | NexusLocale',
  description: 'The terms that govern your use of NexusLocale websites and services.',
};

const CONTENT: LegalContent = {
  fr: {
    title: "Conditions d'utilisation",
    updated: '26 juin 2026',
    sections: [
      { h: '1. Acceptation des présentes conditions', paras: ["En utilisant NexusLocale, en nous contactant ou en louant l'un de nos sites web, vous acceptez les présentes conditions d'utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser nos services."] },
      { h: '2. Nos services', paras: ['NexusLocale conçoit, bâtit, héberge et référence des sites web pour les commerces locaux. Nous optimisons chaque site pour la recherche locale afin que les clients qui cherchent votre service sur Google vous trouvent.'] },
      { h: '3. Le modèle « rank-and-rent »', paras: ['Plusieurs de nos sites sont offerts en mode « rank-and-rent ». Cela signifie :'], bullets: ['Nous bâtissons et référençons le site à nos frais. Vous ne payez aucuns frais initiaux.', "Vous louez le site sur une base mensuelle, tant qu'il vous amène des demandes.", 'Sauf entente écrite contraire, NexusLocale demeure propriétaire du site, de son contenu et du nom de domaine.', 'Vous pouvez annuler en tout temps. À la fin de la location, votre accès aux demandes provenant de ce site prend fin également.'] },
      { h: '4. Frais et paiement', paras: ['Les frais sont convenus avant le début de toute location et facturés de façon récurrente. Un paiement en retard ou refusé peut entraîner la suspension du site ou de la livraison des demandes. Tous les frais sont en dollars canadiens, sauf indication contraire.'] },
      { h: '5. Aucune garantie de positions précises', paras: ['Le positionnement dans les moteurs de recherche dépend de facteurs hors de notre contrôle, dont les changements apportés par Google. Nous travaillons fort pour classer votre site, mais nous ne garantissons aucune position, aucun volume de trafic ni aucun nombre de demandes en particulier.'] },
      { h: '6. Vos responsabilités', paras: ['Vous vous engagez à fournir des renseignements exacts sur votre commerce, à répondre aux demandes de façon professionnelle, et à utiliser tout site ou toute demande conformément aux lois applicables.'] },
      { h: '7. Propriété intellectuelle', paras: ['Sauf entente écrite de transfert de propriété, tous les sites, designs, contenus et domaines créés par NexusLocale demeurent notre propriété. Les logos ou éléments que vous nous fournissez demeurent les vôtres, et vous nous autorisez à les utiliser pour fournir le service.'] },
      { h: '8. Durée et résiliation', paras: ["L'une ou l'autre des parties peut mettre fin à une location moyennant un préavis raisonnable. Nous pouvons suspendre ou résilier le service en cas de non-paiement ou d'utilisation abusive d'un site. À la résiliation, NexusLocale peut réattribuer ou relouer le site à un autre commerce."] },
      { h: '9. Limitation de responsabilité', paras: ["Nos services sont fournis « tels quels ». Dans la pleine mesure permise par la loi, NexusLocale n'est pas responsable des dommages indirects ou consécutifs, des pertes de profits ou des pertes d'affaires découlant de l'utilisation de nos sites ou services."] },
      { h: '10. Modifications des présentes conditions', paras: ['Nous pouvons mettre à jour ces conditions de temps à autre. La version la plus récente sera toujours affichée sur cette page avec sa date de mise à jour.'] },
      { h: '11. Droit applicable', paras: ['Les présentes conditions sont régies par les lois de la province de Québec et les lois applicables du Canada.'] },
      { h: '12. Contact', paras: ['Des questions sur ces conditions ? Écrivez-nous à support@nexuslocale.com.'] },
    ],
  },
  en: {
    title: 'Terms of Service',
    updated: 'June 26, 2026',
    sections: [
      { h: '1. Acceptance of these terms', paras: ['By using NexusLocale, contacting us, or renting one of our websites, you agree to these Terms of Service. If you do not agree, please do not use our services.'] },
      { h: '2. Our services', paras: ['NexusLocale designs, builds, hosts, and ranks websites for local businesses. We optimize each site for local search so that customers looking for your service on Google can find you.'] },
      { h: '3. The rank-and-rent model', paras: ['Many of our websites are offered on a rank-and-rent basis. This means:'], bullets: ['We build and rank the website at our own cost. You pay no upfront fee.', 'You rent the website on a month-to-month basis while it brings you leads.', 'Unless otherwise agreed in writing, NexusLocale owns the website, its content, and the domain name.', 'You may cancel at any time. When the rental ends, your access to the leads from that website ends as well.'] },
      { h: '4. Fees and payment', paras: ['Fees are agreed before any rental begins and are billed on a recurring basis. Late or failed payments may result in suspension of the website or of lead delivery. All fees are in Canadian dollars unless stated otherwise.'] },
      { h: '5. No guarantee of specific rankings', paras: ['Search engine rankings depend on factors outside our control, including changes to Google. We work hard to rank your website, but we do not guarantee a specific position, traffic volume, or number of leads.'] },
      { h: '6. Your responsibilities', paras: ['You agree to provide accurate business information, to respond to leads in a professional manner, and to use any website or leads in compliance with applicable laws.'] },
      { h: '7. Intellectual property', paras: ['Unless a transfer of ownership is agreed in writing, all websites, designs, content, and domains created by NexusLocale remain our property. Any logos or materials you provide remain yours, and you grant us permission to use them to deliver the service.'] },
      { h: '8. Term and termination', paras: ['Either party may end a rental with reasonable notice. We may suspend or terminate service for non-payment or for misuse of a website. On termination, NexusLocale may reassign or rent the website to another business.'] },
      { h: '9. Limitation of liability', paras: ['Our services are provided on an as-is basis. To the fullest extent permitted by law, NexusLocale is not liable for indirect or consequential damages, lost profits, or lost business arising from the use of our websites or services.'] },
      { h: '10. Changes to these terms', paras: ['We may update these terms from time to time. The latest version will always be posted on this page with an updated date.'] },
      { h: '11. Governing law', paras: ['These terms are governed by the laws of the Province of Quebec and the applicable laws of Canada.'] },
      { h: '12. Contact', paras: ['Questions about these terms? Reach us at support@nexuslocale.com.'] },
    ],
  },
};

export default function TermsPage() {
  return <LegalShell content={CONTENT} />;
}
