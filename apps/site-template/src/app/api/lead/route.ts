import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const lead = body as Record<string, unknown>;
  if (!lead['site_domain']) {
    return NextResponse.json({ error: 'site_domain requis' }, { status: 422 });
  }

  const trackerUrl = process.env['TRACKER_WEBHOOK_URL'];

  if (!trackerUrl) {
    // Dév local sans tracker : log seulement
    console.log(`[lead] form — ${lead['site_domain']}`, JSON.stringify(lead, null, 2));
    return NextResponse.json({ ok: true, received_at: new Date().toISOString() });
  }

  const resp = await fetch(`${trackerUrl}/api/lead`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({ ok: false }));
  return NextResponse.json(data, { status: resp.status });
}
