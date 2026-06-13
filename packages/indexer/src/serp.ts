export interface SerpPosition {
  keyword:  string;
  position: number | null; // null = hors top 100 ou pas de résultat
  page:     string | null;
}

const BASE = 'https://api.dataforseo.com/v3';

// ~$0.001 USD par mot-clé (tâche standard)
export const SERP_COST_PER_KEYWORD_USD = 0.001;

function authHeader(login: string, password: string): string {
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

async function dfsFetch<T>(url: string, auth: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

interface TaskPostResponse {
  tasks: Array<{ id: string; status_code: number; status_message: string }>;
}

interface TasksReadyResponse {
  tasks: Array<{ result: Array<{ id: string }> | null }>;
}

interface TaskGetResponse {
  tasks: Array<{
    data: { keyword: string };
    result: Array<{
      items: Array<{
        type:       string;
        rank_group: number;
        url:        string;
        domain:     string;
      }> | null;
    }> | null;
  }>;
}

/** Submits SERP tracking tasks for a list of keywords and polls for results.
 *  Uses the standard (async) task queue to minimize cost.
 *  Quota: 2 000 tasks/day default. */
export async function trackKeywordPositions(opts: {
  domain:       string;
  keywords:     string[];
  locationName: string;
  languageName: string;
  login:        string;
  password:     string;
}): Promise<SerpPosition[]> {
  const auth = authHeader(opts.login, opts.password);

  // 1. Submit tasks
  const submitBody = opts.keywords.map(keyword => ({
    keyword,
    location_name: opts.locationName,
    language_name: opts.languageName,
    se_type:       'organic',
    device:        'desktop',
    depth:         100,
  }));

  const submitted = await dfsFetch<TaskPostResponse>(
    `${BASE}/serp/google/organic/task_post`, auth, 'POST', submitBody,
  );

  const taskIds = submitted.tasks
    .filter(t => t.status_code === 20100)
    .map(t => t.id);

  if (taskIds.length === 0) {
    throw new Error('Aucune tâche SERP acceptée par DataForSEO');
  }

  const taskIdSet = new Set(taskIds);

  // 2. Poll tasks_ready (max 6 min, toutes les 15 s)
  process.stdout.write(`[serp] Attente résultats (${taskIds.length} tâches)`);
  const ready: string[] = [];

  for (let attempt = 0; attempt < 24; attempt++) {
    await sleep(15_000);
    process.stdout.write('.');

    const readyResp = await dfsFetch<TasksReadyResponse>(
      `${BASE}/serp/google/organic/tasks_ready`, auth, 'GET',
    );
    const readyIds = (readyResp.tasks?.[0]?.result ?? []).map(r => r.id);
    for (const id of readyIds) {
      if (taskIdSet.has(id) && !ready.includes(id)) ready.push(id);
    }
    if (ready.length >= taskIds.length) break;
  }
  console.log(` ✓ (${ready.length}/${taskIds.length} prêts)`);

  // 3. Fetch results
  const positions: SerpPosition[] = [];

  for (const id of ready) {
    const result = await dfsFetch<TaskGetResponse>(
      `${BASE}/serp/google/organic/task_get/regular/${id}`, auth, 'GET',
    );
    const task    = result.tasks?.[0];
    const keyword = task?.data?.keyword ?? '';
    const items   = task?.result?.[0]?.items ?? [];

    const match = items.find(
      item => item.type === 'organic' &&
        (item.domain === opts.domain || item.url?.includes(opts.domain)),
    );

    positions.push({
      keyword,
      position: match?.rank_group ?? null,
      page:     match?.url ?? null,
    });
  }

  // Keywords whose tasks didn't complete in time → null
  const done = new Set(positions.map(p => p.keyword));
  for (const kw of opts.keywords) {
    if (!done.has(kw)) positions.push({ keyword: kw, position: null, page: null });
  }

  return positions;
}
