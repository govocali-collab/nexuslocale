// Dictionnaire bilingue de la landing (FR québécois par défaut + EN).
export type Locale = 'fr' | 'en';

export const DICT = {
  fr: {
    nav: { why: 'Pourquoi nous', how: 'Comment ça marche', websites: 'Sites web', contact: 'Contact', signIn: 'Connexion', getStarted: 'Commencer' },
    hero: {
      badge: '✦ Des sites locaux qui se classent sur Google',
      titlePre: 'Soyez trouvé sur Google. Obtenez plus de ',
      titleAccent: 'clients',
      subtitle: 'On conçoit et on référence des sites web pour les commerces locaux. Votre site grimpe au sommet de Google, et les appels arrivent directement chez vous.',
      ctaPrimary: 'Obtenir plus de clients',
      ctaSecondary: 'Comment ça marche',
      micro: 'Aucuns frais initiaux • Vous payez seulement quand vous classez',
    },
    why: {
      heading: 'Des sites web qui vous apportent des clients',
      sub: 'Un design soigné et un référencement local, conçus pour transformer les recherches Google en clients.',
      items: [
        { t: 'Conçu pour votre métier', d: 'Un site propre et professionnel, bâti autour de votre commerce local : plomberie, électricité, excavation et plus.' },
        { t: 'Bâti pour se classer', d: 'Le référencement local est intégré dès le départ, ciblant les recherches exactes faites dans votre ville.' },
        { t: "Plus d'appels et de demandes", d: 'Les gens qui cherchent votre service sur Google vous trouvent en premier, et vous contactent directement.' },
        { t: 'Aucuns frais initiaux', d: 'Modèle « rank-and-rent » : vous payez seulement pendant que votre site se classe et vous rapporte.' },
        { t: 'Entièrement géré', d: "Domaine, hébergement, mises à jour, aspect technique : on s'occupe de tout pour vous." },
        { t: 'Des résultats concrets et mesurables', d: 'Suivez vos positions Google et vos demandes entrantes. Vous voyez exactement ce que vous payez.' },
      ],
    },
    how: {
      heading: 'Comment ça marche',
      sub: "On s'occupe de la conception et du référencement. Vous récoltez les clients.",
      steps: [
        { n: '1', t: 'On bâtit et on classe', d: 'On conçoit un site optimisé pour votre métier et votre ville, pensé pour grimper au sommet de Google.' },
        { n: '2', t: 'Il atteint le sommet', d: 'Votre site se classe pour les recherches locales qui comptent, comme « plombier dans votre ville ».' },
        { n: '3', t: 'Vous le louez, vous recevez les demandes', d: 'Chaque appel et chaque demande arrive directement chez vous. Vous payez seulement tant que le site se classe.' },
      ],
    },
    websites: {
      eyebrow: 'Vous voulez juste un site web ?',
      heading: 'On fait aussi des sites web',
      text: "Tous les commerces ne veulent pas du « rank-and-rent ». Si vous avez simplement besoin d'un beau site web professionnel qui vous appartient, on le conçoit et on le bâtit pour vous.",
      cta: 'Obtenir mon site web',
      points: ['Design sur mesure à votre image', 'Il vous appartient, pour de bon', 'En ligne en quelques jours, pas des mois', 'Adapté au mobile et prêt pour le référencement'],
    },
    finalCta: {
      heading: 'Prêt à dominer Google dans votre ville ?',
      text: "Aucuns frais initiaux, aucun risque. On le classe d'abord, et vous payez seulement pendant qu'il vous amène des clients.",
      button: 'Commencer',
    },
    contact: {
      heading: 'Trouvons-vous plus de clients',
      sub: 'Parlez-nous de votre commerce, et on vous montrera ce que le classement sur Google peut faire.',
    },
    form: {
      firstName: 'Prénom', lastName: 'Nom', email: 'Courriel', phone: 'Téléphone',
      reasonLabel: 'Raison de votre message', messageLabel: 'Message',
      reasons: ['Obtenir un site web pour mon commerce', 'Louer un site classé / obtenir plus de demandes', 'Question générale', 'Partenariat / autre'],
      phFirst: 'Jean', phLast: 'Tremblay', phEmail: 'jean@moncommerce.com', phPhone: '(514) 123-4567',
      phMessage: 'Parlez-nous de votre commerce et de ce dont vous avez besoin.',
      captchaNeeded: 'Veuillez compléter le captcha.', genericError: "Une erreur s'est produite.",
      send: 'Envoyer le message', sending: 'Envoi…', sentTitle: 'Message envoyé !', sentBody: 'Merci, on vous revient sous peu.',
    },
    footer: { terms: 'Conditions', privacy: 'Confidentialité' },
  },

  en: {
    nav: { why: 'Why us', how: 'How it works', websites: 'Websites', contact: 'Contact', signIn: 'Sign in', getStarted: 'Get started' },
    hero: {
      badge: '✦ Local websites that rank on Google',
      titlePre: 'Get found on Google. Get more ',
      titleAccent: 'customers',
      subtitle: 'We design and rank websites for local businesses. Your site climbs to the top of Google, and the calls come straight to you.',
      ctaPrimary: 'Get more customers',
      ctaSecondary: 'How it works',
      micro: 'No upfront cost • Pay only while you rank',
    },
    why: {
      heading: 'Websites that bring you business',
      sub: 'Beautiful design and local SEO, built to turn Google searches into customers.',
      items: [
        { t: 'Designed for your trade', d: 'A clean, professional website built around your local business: plumbing, electrical, excavation and more.' },
        { t: 'Built to rank', d: 'Local SEO is baked in from day one, targeting the exact searches people make in your city.' },
        { t: 'More calls & leads', d: 'The people searching for your service on Google find you first, and reach out directly.' },
        { t: 'No upfront cost', d: 'Rank-and-rent model: you pay only while your site ranks and brings you business.' },
        { t: 'Fully managed', d: "Domain, hosting, updates, technical work: we handle everything so you don't have to." },
        { t: 'Real, trackable results', d: "Follow your Google rankings and incoming leads. You see exactly what you're paying for." },
      ],
    },
    how: {
      heading: 'How it works',
      sub: 'We do the building and the ranking. You get the customers.',
      steps: [
        { n: '1', t: 'We build & rank', d: 'We design a website optimized for your trade and city, engineered to climb to the top of Google.' },
        { n: '2', t: 'It reaches the top', d: 'Your site ranks for the local searches that matter, like “plumber in your city”.' },
        { n: '3', t: 'You rent it, get leads', d: 'Every call and request comes straight to you. You pay only while the site keeps ranking.' },
      ],
    },
    websites: {
      eyebrow: 'Just need a website?',
      heading: 'We build websites too',
      text: 'Not every business wants rank-and-rent. If you simply need a beautiful, professional website that you own, we design and build it for you.',
      cta: 'Get your website',
      points: ['Custom design for your brand', 'Yours to keep, forever', 'Live in days, not months', 'Mobile-friendly and SEO-ready'],
    },
    finalCta: {
      heading: 'Ready to own Google in your city?',
      text: 'No upfront cost, no risk. We rank it first, and you only pay while it brings you customers.',
      button: 'Get started',
    },
    contact: {
      heading: "Let's get you more customers",
      sub: "Tell us about your business, and we'll show you what ranking on Google can do.",
    },
    form: {
      firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone',
      reasonLabel: 'Reason for your message', messageLabel: 'Message',
      reasons: ['Get a website for my business', 'Rent a ranked site / get more leads', 'General question', 'Partnership / other'],
      phFirst: 'John', phLast: 'Doe', phEmail: 'john@business.com', phPhone: '(555) 123-4567',
      phMessage: 'Tell us about your business and what you need.',
      captchaNeeded: 'Please complete the captcha.', genericError: 'Something went wrong.',
      send: 'Send message', sending: 'Sending…', sentTitle: 'Message sent!', sentBody: "Thanks, we'll get back to you shortly.",
    },
    footer: { terms: 'Terms', privacy: 'Privacy' },
  },
} as const;
