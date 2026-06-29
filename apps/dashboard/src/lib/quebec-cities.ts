// Provinces disponibles pour le Prospector (extensible).
export const PROVINCES: { code: string; name: string }[] = [
  { code: 'QC', name: 'Québec' },
];

export interface CityInfo { name: string; pop: number }

// Villes du Québec de plus de 50 000 habitants (recensement 2021), par population décroissante.
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
    { name: 'Granby',                    pop: 69025 },
    { name: 'Mirabel',                   pop: 60891 },
    { name: 'Blainville',                pop: 59819 },
    { name: 'Saint-Hyacinthe',           pop: 57239 },
    { name: 'Mascouche',                 pop: 52232 },
    { name: 'Châteauguay',               pop: 50815 },
  ],
};

// Quartiers / arrondissements pour le « scan en profondeur » : Google plafonne à
// 60 résultats par recherche, donc chercher par quartier multiplie la couverture
// (surtout les petites entreprises locales avec de mauvais sites).
export const NEIGHBORHOODS: Record<string, string[]> = {
  'Montréal': [
    'Rosemont', 'Villeray', 'Ahuntsic', 'Saint-Michel', 'Hochelaga', 'Mercier',
    'Anjou', 'Saint-Léonard', 'Montréal-Nord', 'Rivière-des-Prairies', 'Pointe-aux-Trembles',
    'Plateau Mont-Royal', 'Centre-ville Montréal', 'Le Sud-Ouest Montréal', 'Verdun',
    'LaSalle', 'Lachine', 'Côte-des-Neiges', 'Notre-Dame-de-Grâce', 'Saint-Laurent',
    'Pierrefonds', 'Outremont',
  ],
  'Québec': [
    'Sainte-Foy', 'Sillery', 'Charlesbourg', 'Beauport', 'Limoilou', 'Vanier Québec',
    'Cap-Rouge', 'Loretteville', 'Val-Bélair', 'Lebourgneuf',
  ],
  'Laval': [
    'Chomedey', 'Laval-des-Rapides', 'Pont-Viau', 'Vimont', 'Auteuil', 'Sainte-Dorothée',
    'Sainte-Rose', 'Fabreville', 'Saint-François Laval', 'Duvernay',
  ],
  'Gatineau': ['Hull', 'Aylmer', 'Gatineau', 'Buckingham', 'Masson-Angers'],
  'Longueuil': ['Vieux-Longueuil', 'Saint-Hubert', 'Greenfield Park'],
};
