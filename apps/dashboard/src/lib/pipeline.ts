// Source UNIQUE de vérité pour les étapes du pipeline (statuts prospects).
// Importée par le kanban, la vue d'ensemble et la fiche prospect →
// la vue d'ensemble reflète TOUJOURS le pipeline. Ajouter/changer une étape ici
// la propage partout (ne pas oublier la valeur d'enum côté DB si on en ajoute).

export const PIPELINE_STAGES = [
  { id: 'new',         label: 'Nouveaux',      accent: 'border-t-slate-400'   },
  { id: 'demo_booked', label: 'RDV démo Zoom', accent: 'border-t-violet-500'  },
  { id: 'demo_sent',   label: 'Démo envoyée',  accent: 'border-t-sky-500'     },
  { id: 'negotiating', label: 'Négociation',   accent: 'border-t-amber-500'   },
  { id: 'won',         label: 'Gagnés',        accent: 'border-t-emerald-500' },
  { id: 'lost',        label: 'Perdus',        accent: 'border-t-red-400'     },
] as const;

export const PIPELINE_STATUSES: string[] = PIPELINE_STAGES.map(s => s.id);
export const PIPELINE_LABELS: Record<string, string> =
  Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, s.label]));
export const PIPELINE_ACCENT: Record<string, string> =
  Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, s.accent]));
