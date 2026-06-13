// Client
export { createDb, getDb } from './client.js';
export type { Db } from './client.js';

// Types
export type {
  Database,
  // Tables
  Site, SiteInsert, SiteUpdate,
  Lead, LeadInsert, LeadUpdate,
  Ranking, RankingInsert, RankingUpdate,
  Prospect, ProspectInsert, ProspectUpdate,
  Client, ClientInsert, ClientUpdate,
  Upsell, UpsellInsert, UpsellUpdate,
  // Enums
  SiteType, SiteStatus,
  LeadType,
  WebPresence, ProspectStatus,
  UpsellProduct, UpsellStatus,
} from './types.js';

// Helpers
export * from './helpers/sites.js';
export * from './helpers/leads.js';
export * from './helpers/rankings.js';
export * from './helpers/prospects.js';
export * from './helpers/clients.js';
export * from './helpers/upsells.js';
