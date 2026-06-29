// Script d'appel par défaut (constante — séparée des Server Actions car un fichier
// 'use server' ne peut exporter que des fonctions async).
export const DEFAULT_CALL_SCRIPT = `Toi : Bonjour, est-ce que je parle au propriétaire?

Lui : Oui.

Toi : Bonjour, je m'appelle [Prénom]. Je vous dérange 30 secondes?

(Laisse-le répondre.)

Toi : En regardant {entreprise} sur Google, j'ai remarqué que votre site web est [absent / assez vieux / présente quelques problèmes].

(Pause.)

Lui : Ah oui?

Toi : Je suis curieux... est-ce que c'est quelque chose que vous aviez déjà remarqué ou pas vraiment?

(Laisse-le parler.)

Selon sa réponse :

« La raison de mon appel, c'est que j'ai préparé une idée de ce que votre présence web pourrait devenir. Je peux vous la montrer gratuitement sur Zoom. Ça prend une quinzaine de minutes, sans aucune obligation.

Vous êtes généralement plus disponible le matin ou en après-midi? »`;
