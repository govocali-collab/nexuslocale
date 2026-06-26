// Dictionnaire bilingue de la landing (FR québécois par défaut + EN).
export type Locale = 'fr' | 'en';

export const DICT = {
  fr: {
    nav: { why: 'Pourquoi nous', how: 'Comment ça marche', websites: 'Sites web', contact: 'Contact', signIn: 'Connexion', getStarted: 'On commence' },
    hero: {
      badge: '✦ Des sites web locaux qui rankent sur Google',
      titlePre: 'Soyez trouvé sur Google. Plus de ',
      titleAccent: 'clients',
      subtitle: 'On design et on ranke des sites web pour les business locaux. Votre site monte dans le top de Google, et les appels rentrent directement chez vous.',
      ctaPrimary: 'Avoir plus de clients',
      ctaSecondary: 'Comment ça marche',
      micro: "Aucuns frais d'avance • Vous payez juste quand vous êtes dans le top",
    },
    why: {
      heading: 'Des sites web qui vous ramènent des clients',
      sub: 'Un beau design et du SEO local, faits pour transformer les recherches Google en clients.',
      items: [
        { t: 'Fait pour votre métier', d: 'Un site propre et professionnel, bâti autour de votre business local : plomberie, électricité, excavation et plus.' },
        { t: 'Bâti pour le top de Google', d: 'Le SEO local est intégré dès le départ, ciblé sur les recherches que le monde fait dans votre ville.' },
        { t: "Plus d'appels et de leads", d: 'Le monde qui cherche votre service sur Google vous trouve en premier, et vous contacte directement.' },
        { t: "Aucuns frais d'avance", d: 'Modèle rank-and-rent : vous payez juste pendant que votre site est dans le top et vous ramène du business.' },
        { t: 'Géré au complet', d: "Domaine, hébergement, mises à jour, le technique : on s'occupe de tout pour vous." },
        { t: 'Des résultats clairs et mesurables', d: 'Suivez vos positions Google et vos leads entrants. Vous voyez exactement ce que vous payez.' },
      ],
    },
    how: {
      heading: 'Comment ça marche',
      sub: 'On s’occupe du site et du SEO. Vous, vous ramassez les clients.',
      steps: [
        { n: '1', t: 'On bâtit et on ranke', d: 'On design un site optimisé pour votre métier et votre ville, fait pour monter dans le top de Google.' },
        { n: '2', t: 'Il monte dans le top', d: 'Votre site ranke sur les recherches locales qui comptent, comme « plombier dans votre ville ».' },
        { n: '3', t: 'Vous le louez, vous recevez les leads', d: 'Chaque appel et chaque demande rentre directement chez vous. Vous payez juste tant que le site reste dans le top.' },
      ],
    },
    websites: {
      eyebrow: 'Vous voulez juste un site web ?',
      heading: 'On fait des sites web aussi',
      text: "Ce ne sont pas tous les business qui veulent du rank-and-rent. Si vous avez juste besoin d'un beau site web professionnel qui vous appartient, on le design et on le bâtit pour vous.",
      cta: 'Avoir mon site web',
      points: ['Design sur mesure à votre image', 'Il vous appartient, pour de bon', 'Online en quelques jours, pas des mois', 'Adapté au mobile et prêt pour le SEO'],
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
