import type { Metadata } from 'next';
import { LegalShell, Section, P, Bullets } from '@/components/landing/legal-shell';

export const metadata: Metadata = {
  title: 'Privacy Policy | NexusLocale',
  description: 'How NexusLocale collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="June 26, 2026">
      <Section title="1. Information we collect">
        <P>When you contact us through our website, we collect the information you provide, such as:</P>
        <Bullets items={[
          'Your first and last name',
          'Your email address and phone number',
          'The reason for your message and the message itself',
          'Basic technical data such as your browser type and pages visited',
        ]} />
      </Section>

      <Section title="2. How we use your information">
        <P>We use your information to respond to your inquiry, to provide and improve our services, to send you information you have requested, and to meet our legal obligations. We do not sell your personal information.</P>
      </Section>

      <Section title="3. Cookies and analytics">
        <P>We may use cookies and analytics tools to understand how visitors use our website so we can improve it. You can control cookies through your browser settings.</P>
      </Section>

      <Section title="4. How we share information">
        <P>We share information only with trusted service providers who help us run our business, such as our email provider, hosting provider, and search and analytics platforms. These providers may only use your information to perform services on our behalf.</P>
      </Section>

      <Section title="5. Data retention">
        <P>We keep your information only as long as needed to respond to you, to provide our services, and to comply with the law. After that, we delete or anonymize it.</P>
      </Section>

      <Section title="6. Your rights">
        <P>Under applicable Quebec and Canadian privacy law, you may:</P>
        <Bullets items={[
          'Ask to access the personal information we hold about you',
          'Ask us to correct information that is inaccurate',
          'Ask us to delete your information, subject to legal limits',
          'Withdraw your consent at any time',
        ]} />
        <P>To exercise these rights, email us at support@nexuslocale.com.</P>
      </Section>

      <Section title="7. Security">
        <P>We take reasonable measures to protect your information against loss, theft, and unauthorized access. No method of transmission over the internet is fully secure, but we work to keep your data safe.</P>
      </Section>

      <Section title="8. Changes to this policy">
        <P>We may update this policy from time to time. The latest version will always be posted on this page with an updated date.</P>
      </Section>

      <Section title="9. Contact">
        <P>Questions about your privacy? Reach us at support@nexuslocale.com.</P>
      </Section>
    </LegalShell>
  );
}
