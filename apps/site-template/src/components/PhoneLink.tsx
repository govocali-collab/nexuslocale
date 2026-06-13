// Source unique du numéro de téléphone — toujours depuis config.business.phone
// Changer ce composant = changer le numéro partout (header, CTA, footer)

type PhoneLinkProps = {
  phone: string;
  className?: string;
  children?: React.ReactNode;
};

export function PhoneLink({ phone, className, children }: PhoneLinkProps) {
  const href = `tel:${phone.replace(/\D/g, '')}`;
  return (
    <a href={href} className={className}>
      {children ?? phone}
    </a>
  );
}
