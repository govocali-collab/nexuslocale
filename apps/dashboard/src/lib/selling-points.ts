import type { Prospect } from './queries';

export interface SalesArg { icon: string; text: string }

// Transforme les données du prospect (présence web, problèmes détectés, réputation)
// en arguments de vente concrets, prêts à utiliser en appel/courriel.
export function sellingArguments(p: Prospect): SalesArg[] {
  const args: SalesArg[] = [];
  const niche = p.niche || 'votre service';
  const city  = p.city  || 'votre région';
  const issues = p.detected_issues ?? [];
  const has = (kw: string) => issues.some(i => i.toLowerCase().includes(kw.toLowerCase()));
  const goodRep = (p.rating ?? 0) >= 4.3 && (p.review_count ?? 0) >= 15;

  // ── Présence web globale ──
  if (p.web_presence === 'none') {
    args.push({ icon: '🔍', text: `Aucun site web : quand un client cherche « ${niche} ${city} » sur Google, il tombe sur vos concurrents — pas sur vous.` });
    args.push({ icon: '📈', text: `Vous dépendez du bouche-à-oreille. Un site capte les nouveaux clients qui ne vous connaissent pas encore.` });
  } else if (p.web_presence === 'social_only') {
    args.push({ icon: '🔍', text: `Présence limitée aux réseaux sociaux : vous n'apparaissez pas dans les recherches Google, là où la majorité des clients locaux commencent.` });
    args.push({ icon: '🏛️', text: `Une page Facebook n'inspire pas la même confiance qu'un vrai site, et n'est pas référencée sur Google.` });
  }

  // ── Problèmes de site détectés ──
  if (has('mort') || has('inaccessible') || has('erreur') || has('timeout') || has('ssl') || has('http ')) {
    args.push({ icon: '💀', text: `Votre site est cassé/inaccessible : chaque visiteur qui clique repart aussitôt. C'est pire que pas de site du tout.` });
  }
  if (has('mobile') || has('viewport')) {
    args.push({ icon: '📱', text: `Site non adapté au mobile : la majorité de vos clients vous consultent sur téléphone et voient un site illisible.` });
  }
  if (has('copyright') || has('non maintenu')) {
    args.push({ icon: '🕸️', text: `Site visiblement abandonné (vieux copyright) : ça donne l'impression que l'entreprise n'est plus active.` });
  }
  if (has('builder') || has('wix') || has('générique') || has('godaddy') || has('squarespace')) {
    args.push({ icon: '🎨', text: `Site générique (template) : il ressemble à mille autres et inspire moins confiance qu'un site sur mesure.` });
  }
  if (has('lourde') || has('lent')) {
    args.push({ icon: '🐌', text: `Site lent à charger : plus de la moitié des visiteurs partent si une page met plus de 3 secondes.` });
  }
  if (has('https')) {
    args.push({ icon: '🔓', text: `Pas de HTTPS : Google affiche « Site non sécurisé » à vos visiteurs et vous pénalise dans le classement.` });
  }

  // ── Réputation ──
  if (goodRep && p.web_presence !== 'has_site') {
    args.push({ icon: '⭐', text: `Vous avez ⭐${p.rating} (${p.review_count} avis) — une excellente réputation, mais aucune vitrine en ligne pour la mettre en valeur.` });
  } else if (goodRep) {
    args.push({ icon: '⭐', text: `Avec ⭐${p.rating} et ${p.review_count} avis, vous méritez un site à la hauteur de votre réputation.` });
  }

  // ── Angle de fermeture (toujours présent) ──
  args.push({ icon: '🎯', text: `Vos concurrents avec un bon site captent les clients « ${niche} ${city} » que vous pourriez avoir. Un site bien référencé renverse ça.` });

  return args;
}
