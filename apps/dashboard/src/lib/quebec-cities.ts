// Provinces disponibles pour le Prospector (extensible).
export const PROVINCES: { code: string; name: string }[] = [
  { code: 'QC', name: 'Québec' },
];

export interface CityInfo { name: string; pop: number }

// Villes du Québec de plus de 75 000 habitants (recensement 2021), par population décroissante.
export const CITIES_BY_PROVINCE: Record<string, CityInfo[]> = {
  QC: [
    { name: 'Montréal',                  pop: 1762949 },
    { name: 'Québec',                    pop: 549459 },
    { name: 'Laval',                     pop: 438366 },
    { name: 'Gatineau',                  pop: 291041 },
    { name: 'Longueuil',                 pop: 254483 },
    { name: 'Sherbrooke',                pop: 172950 },
    { name: 'Lévis',                     pop: 149683 },
    { name: 'Saguenay',                  pop: 144723 },
    { name: 'Trois-Rivières',            pop: 139163 },
    { name: 'Terrebonne',                pop: 119944 },
    { name: 'Saint-Jean-sur-Richelieu',  pop: 98036 },
    { name: 'Brossard',                  pop: 91525 },
    { name: 'Repentigny',                pop: 86838 },
    { name: 'Drummondville',             pop: 81239 },
    { name: 'Saint-Jérôme',              pop: 80205 },
  ],
};
