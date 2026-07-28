/**
 * Seed `event_days` — repeatable/idempotent (upsert on day_number).
 * Run: node --env-file=.env.local db/seed-event-days.mjs
 *
 * Event: 4–14 August 2026 (11 days). Daily window 06:00–22:00 GMT+1 (Africa/Lagos).
 * Windows are stored as timestamptz; the +01:00 offset encodes GMT+1 (D-001/D-002).
 * Edit the constants below and re-run to adjust dates or hours.
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const TZ = '+01:00'; // GMT+1, no DST
const OPEN = '06:00:00';
const CLOSE = '22:00:00';
const START_DOM = 4; // 4 Aug 2026
const NUM_DAYS = 11; // 4–14 Aug inclusive

const rows = [];
for (let i = 0; i < NUM_DAYS; i++) {
  const dom = START_DOM + i;
  const dd = String(dom).padStart(2, '0');
  rows.push({
    n: i + 1,
    label: `Day ${i + 1} — ${dom} Aug 2026`,
    starts: `2026-08-${dd}T${OPEN}${TZ}`,
    ends: `2026-08-${dd}T${CLOSE}${TZ}`,
  });
}

for (const r of rows) {
  await sql`
    insert into event_days (day_number, label, starts_at, ends_at)
    values (${r.n}, ${r.label}, ${r.starts}, ${r.ends})
    on conflict (day_number) do update
      set label = excluded.label,
          starts_at = excluded.starts_at,
          ends_at = excluded.ends_at`;
}

const out = await sql`
  select day_number, label, starts_at, ends_at from event_days order by day_number`;
console.log(`Seeded ${out.length} event days (window ${OPEN}–${CLOSE} ${TZ}):`);
for (const d of out) {
  console.log(`  #${d.day_number}  ${d.label}  ${d.starts_at} -> ${d.ends_at}`);
}
