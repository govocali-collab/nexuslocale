import express, { type Express } from 'express';
import { handleVoiceIncoming, handleVoiceStatus } from './routes/voice.js';
import { handleSmsIncoming }                       from './routes/sms.js';
import { handleFormLead }                          from './routes/lead.js';

const app: Express = express();
const PORT = parseInt(process.env['PORT'] ?? '3002', 10);

// ─── Body parsers ─────────────────────────────────────────────────────────────
// Twilio envoie du form-urlencoded ; le site-template envoie du JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ─── CORS minimal pour /api/lead ──────────────────────────────────────────────
app.use('/api/lead', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.post('/webhooks/voice',        handleVoiceIncoming);
app.post('/webhooks/voice/status', handleVoiceStatus);
app.post('/webhooks/sms',          handleSmsIncoming);
app.post('/api/lead',              handleFormLead);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const webhookUrl = process.env['TRACKER_WEBHOOK_URL'] ?? `http://localhost:${PORT}`;
  console.log(`\n🎯 Tracker webhook server — port ${PORT}`);
  console.log(`   Health  : http://localhost:${PORT}/health`);
  console.log(`   Webhooks: ${webhookUrl}/webhooks/voice`);
  console.log(`   Lead API: ${webhookUrl}/api/lead`);
  if (!process.env['TWILIO_ACCOUNT_SID']) {
    console.warn('   ⚠  TWILIO_ACCOUNT_SID absent — signatures non validées');
  }
  if (process.env['SKIP_TWILIO_SIGNATURE'] === 'true') {
    console.warn('   ⚠  SKIP_TWILIO_SIGNATURE=true — validation désactivée (dev uniquement)');
  }
});

export default app;
