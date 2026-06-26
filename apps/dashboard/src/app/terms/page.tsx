import type { Metadata } from 'next';
import { LegalShell, Section, P, Bullets } from '@/components/landing/legal-shell';

export const metadata: Metadata = {
  title: 'Terms of Service | NexusLocale',
  description: 'The terms that govern your use of NexusLocale websites and services.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="June 26, 2026">
      <Section title="1. Acceptance of these terms">
        <P>By using NexusLocale, contacting us, or renting one of our websites, you agree to these Terms of Service. If you do not agree, please do not use our services.</P>
      </Section>

      <Section title="2. Our services">
        <P>NexusLocale designs, builds, hosts, and ranks websites for local businesses. We optimize each site for local search so that customers looking for your service on Google can find you.</P>
      </Section>

      <Section title="3. The rank and rent model">
        <P>Many of our websites are offered on a rank and rent basis. This means:</P>
        <Bullets items={[
          'We build and rank the website at our own cost. You pay no upfront fee.',
          'You rent the website on a month to month basis while it brings you leads.',
          'Unless otherwise agreed in writing, NexusLocale owns the website, its content, and the domain name.',
          'You may cancel at any time. When the rental ends, your access to the leads from that website ends as well.',
        ]} />
      </Section>

      <Section title="4. Fees and payment">
        <P>Fees are agreed before any rental begins and are billed on a recurring basis. Late or failed payments may result in suspension of the website or of lead delivery. All fees are in Canadian dollars unless stated otherwise.</P>
      </Section>

      <Section title="5. No guarantee of specific rankings">
        <P>Search engine rankings depend on factors outside our control, including changes to Google. We work hard to rank your website, but we do not guarantee a specific position, traffic volume, or number of leads.</P>
      </Section>

      <Section title="6. Your responsibilities">
        <P>You agree to provide accurate business information, to respond to leads in a professional manner, and to use any website or leads in compliance with applicable laws.</P>
      </Section>

      <Section title="7. Intellectual property">
        <P>Unless a transfer of ownership is agreed in writing, all websites, designs, content, and domains created by NexusLocale remain our property. Any logos or materials you provide remain yours, and you grant us permission to use them to deliver the service.</P>
      </Section>

      <Section title="8. Term and termination">
        <P>Either party may end a rental with reasonable notice. We may suspend or terminate service for non payment or for misuse of a website. On termination, NexusLocale may reassign or rent the website to another business.</P>
      </Section>

      <Section title="9. Limitation of liability">
        <P>Our services are provided on an as is basis. To the fullest extent permitted by law, NexusLocale is not liable for indirect or consequential damages, lost profits, or lost business arising from the use of our websites or services.</P>
      </Section>

      <Section title="10. Changes to these terms">
        <P>We may update these terms from time to time. The latest version will always be posted on this page with an updated date.</P>
      </Section>

      <Section title="11. Governing law">
        <P>These terms are governed by the laws of the Province of Quebec and the applicable laws of Canada.</P>
      </Section>

      <Section title="12. Contact">
        <P>Questions about these terms? Reach us at contact@nexuslocale.com.</P>
      </Section>
    </LegalShell>
  );
}
