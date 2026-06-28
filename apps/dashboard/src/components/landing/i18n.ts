// Dictionnaire bilingue de la landing (FR québécois par défaut + EN).
export type Locale = 'fr' | 'en';

export const DICT = {
  fr: {
    nav: { why: 'Pourquoi nous', how: 'Comment ça marche', websites: 'Sites web', contact: 'Contact', getStarted: 'On commence' },
    hero: {
      badge: '✦ Des sites web locaux qui rankent sur Google',
      titleL1: 'Plus de clients,',
      titleL2Pre: 'directement de ',
      titleAccent: 'Google',
      subtitle: 'On bâtit et on ranke des sites web locaux. Ils montent dans le top de Google, et on vous envoie les appels et les leads directement.',
      ctaPrimary: 'Avoir plus de clients',
      ctaSecondary: 'Comment ça marche',
    },
    why: {
      heading: 'On vous ramène des clients depuis Google',
      sub: 'On bâtit et on ranke les sites ; vous, vous recevez les appels et les leads.',
      items: [
        { t: 'Ciblé sur votre métier', d: 'On bâtit et on optimise un site pour votre métier et votre ville : plomberie, électricité, excavation et plus.' },
        { t: 'Bâti pour le top de Google', d: 'Le SEO local est intégré dès le départ, ciblé sur les recherches que le monde fait dans votre ville.' },
        { t: "Plus d'appels et de leads", d: 'Quand quelqu’un cherche votre service sur Google, l’appel vous revient directement.' },
        { t: "Aucuns frais d'avance", d: 'Modèle rank-and-rent : le site nous appartient. Vous payez juste pendant qu’il est dans le top et qu’il vous envoie des leads.' },
        { t: 'Géré au complet', d: "Domaine, hébergement, mises à jour, le technique : on s'occupe de tout pour vous." },
        { t: 'Des résultats clairs et mesurables', d: 'Suivez les positions Google et vos leads entrants. Vous voyez exactement ce que vous payez.' },
      ],
    },
    how: {
      heading: 'Comment ça marche',
      sub: 'On s’occupe du site et du SEO. Vous, vous ramassez les clients.',
      steps: [
        { n: '1', t: 'On bâtit et on ranke', d: 'On design un site optimisé pour votre métier et votre ville, fait pour monter dans le top de Google.' },
        { n: '2', t: 'Il monte dans le top', d: 'Le site ranke sur les recherches locales qui comptent, comme « plombier dans votre ville ».' },
        { n: '3', t: 'Vous recevez les leads', d: 'On garde et on gère le site ; vous, vous recevez chaque appel et chaque demande directement. Vous payez juste tant que ça vous ramène du business.' },
      ],
    },
    websites: {
      eyebrow: 'Vous voulez juste un site web ?',
      heading: 'On fait des sites web aussi',
      text: "Ce ne sont pas tous les business qui veulent du rank-and-rent. Si vous avez juste besoin d'un beau site web professionnel qui vous appartient, on le design et on le bâtit pour vous.",
      text2: "Page d'accueil, pages de services, photos, formulaire de contact, Google Maps : on s'occupe de tout, de A à Z. Vous obtenez un site rapide, clair et qui inspire confiance, prêt à attirer des clients.",
      cta: 'Avoir mon site web',
      points: ['Design sur mesure à votre image', 'Il vous appartient, pour de bon', 'Online en quelques jours, pas des mois', 'Adapté au mobile et prêt pour le SEO', 'Hébergement et nom de domaine inclus', 'On s’occupe des mises à jour'],
      perfectFor: 'Parfait pour : restaurants, salons, contracteurs, services pro et plus.',
    },
    finalCta: {
      heading: 'Prêt à dominer Google dans votre ville ?',
      text: "Aucuns frais d'avance, aucun risque. On vous ranke en premier, et vous payez juste pendant que ça vous ramène des clients.",
      button: 'On commence',
    },
    contact: {
      heading: 'On va vous trouver plus de clients',
      sub: 'Parlez-nous de votre business, et on va vous montrer ce que le top de Google peut faire.',
    },
    form: {
      firstName: 'Prénom', lastName: 'Nom', email: 'Courriel', phone: 'Téléphone',
      reasonLabel: 'Raison de votre message', messageLabel: 'Message',
      reasons: ['Avoir un site web pour mon business', 'Louer un site qui ranke / avoir plus de leads', 'Question générale', 'Partenariat / autre'],
      phFirst: 'Jean', phLast: 'Tremblay', phEmail: 'jean@monbusiness.com', phPhone: '(514) 123-4567',
      phMessage: 'Parlez-nous de votre business et de ce dont vous avez besoin.',
      captchaNeeded: "Complétez le captcha s'il vous plaît.", genericError: "Une erreur s'est produite.",
      send: 'Envoyer le message', sending: 'Envoi…', sentTitle: 'Message envoyé !', sentBody: 'Merci, on vous revient bientôt.',
    },
    footer: { terms: 'Conditions', privacy: 'Confidentialité' },
  },

  en: {
    nav: { why: 'Why us', how: 'How it works', websites: 'Websites', contact: 'Contact', getStarted: 'Get started' },
    hero: {
      badge: '✦ Local websites that rank on Google',
      titleL1: 'More customers,',
      titleL2Pre: 'straight from ',
      titleAccent: 'Google',
      subtitle: 'We build and rank local websites. They climb to the top of Google, and we send the calls and leads straight to you.',
      ctaPrimary: 'Get more customers',
      ctaSecondary: 'How it works',
    },
    why: {
      heading: 'We bring you customers from Google',
      sub: 'We build and rank the sites; you get the calls and the leads.',
      items: [
        { t: 'Targeted to your trade', d: 'We build and optimize a site for your trade and city: plumbing, electrical, excavation and more.' },
        { t: 'Built to rank', d: 'Local SEO is baked in from day one, targeting the exact searches people make in your city.' },
        { t: 'More calls & leads', d: 'When someone searches for your service on Google, the call comes straight to you.' },
        { t: 'No upfront cost', d: 'Rank-and-rent model: we own the site. You pay only while it ranks and sends you leads.' },
        { t: 'Fully managed', d: "Domain, hosting, updates, technical work: we handle everything so you don't have to." },
        { t: 'Real, trackable results', d: "Follow the Google rankings and your incoming leads. You see exactly what you're paying for." },
      ],
    },
    how: {
      heading: 'How it works',
      sub: 'We do the building and the ranking. You get the customers.',
      steps: [
        { n: '1', t: 'We build & rank', d: 'We design a website optimized for your trade and city, engineered to climb to the top of Google.' },
        { n: '2', t: 'It reaches the top', d: 'The site ranks for the local searches that matter, like “plumber in your city”.' },
        { n: '3', t: 'You get the leads', d: 'We keep and manage the site; every call and request comes straight to you. You pay only while it brings you business.' },
      ],
    },
    websites: {
      eyebrow: 'Just need a website?',
      heading: 'We build websites too',
      text: 'Not every business wants rank-and-rent. If you simply need a beautiful, professional website that you own, we design and build it for you.',
      text2: 'Homepage, service pages, photos, contact form, Google Maps: we handle it all, end to end. You get a fast, clean website that builds trust and is ready to bring in customers.',
      cta: 'Get your website',
      points: ['Custom design for your brand', 'Yours to keep, forever', 'Live in days, not months', 'Mobile-friendly and SEO-ready', 'Hosting and domain included', 'We handle the updates'],
      perfectFor: 'Perfect for: restaurants, salons, contractors, pro services and more.',
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
