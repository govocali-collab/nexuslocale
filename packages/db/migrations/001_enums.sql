-- Migration 001 : tous les types enum partagés
-- Appliquer EN PREMIER avant les tables

create type site_type   as enum ('rent', 'client', 'demo');
create type site_status as enum ('research', 'built', 'indexed', 'ranking', 'rented', 'sold');

create type lead_type   as enum ('call', 'sms', 'form');

create type web_presence    as enum ('none', 'social_only', 'has_site');
create type prospect_status as enum ('new', 'demo_sent', 'negotiating', 'won', 'lost');

create type upsell_product as enum ('call_tracking', 'sms_automation', 'ai_chatbot', 'voice_receptionist');
create type upsell_status  as enum ('active', 'paused', 'cancelled');
