-- Migration 013 : nouveau statut prospect « demo_booked » (RDV démo Zoom booké)
-- S'insère dans le pipeline entre « new » et « demo_sent ».
alter type prospect_status add value if not exists 'demo_booked' before 'demo_sent';
