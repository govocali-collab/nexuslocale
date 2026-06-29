-- Migration 018 : stocke le SID du SMS programmé (Twilio) pour pouvoir l'annuler
-- si le RDV est annulé/déplacé.
alter table public.appointments add column if not exists sms_sid text;
