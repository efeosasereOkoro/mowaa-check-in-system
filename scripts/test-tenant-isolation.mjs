// Permanent cross-tenant isolation suite (E12-S3, design doc §9). Run in CI on every
// change. Proves — against the real Neon DB, as the non-owner `app_authenticated` role —
// that a staffer of tenant A can never read, insert, update or delete tenant B's rows,
// that queries fail closed with no staff context, and (meta-guard) that every policy on
// every tenant-scoped table carries the `app_tenant_id()` predicate — so a future table
// or policy added without tenant scoping makes this suite fail.
//
// It creates two throwaway tenants (iso-test-a / iso-test-b) with their own staff + data,
// asserts isolation both directions, then deletes them. It never touches real tenant data.
//
//   node scripts/test-tenant-isolation.mjs      (or: npm run test:isolation)

import { config } from 'dotenv';
config({ path: '.env.local' });
import { Pool, neonConfig } from '@neondatabase/serverless';

if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

const owner = new Pool({ connectionString: process.env.DATABASE_URL });
const app = new Pool({ connectionString: process.env.DATABASE_AUTHENTICATED_URL });

// Tables that carry tenant_id and must be tenant-scoped by RLS.
const TENANT_TABLES = [
  'children',
  'tags',
  'pickup_persons',
  'guardians',
  'staff',
  'event_days',
  'attendance_log',
  'medical_notes',
];
const APPEND_ONLY = ['attendance_log', 'medical_notes'];

let passed = 0;
let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log('  ✓', name);
  } else {
    failed++;
    console.log('  ✗', name, detail ? `— ${detail}` : '');
  }
}

// Run `fn` as the given staff id (or null = no context) on the app_authenticated role.
// Always rolls back, so test writes never persist. Each call is its own transaction, so a
// deliberately-failing statement (aborted tx) doesn't poison the next assertion.
async function asStaff(staffId, fn) {
  const c = await app.connect();
  try {
    await c.query('begin');
    if (staffId !== null) {
      await c.query("select set_config('app.staff_id', $1, true)", [staffId]);
    }
    return await fn(c);
  } finally {
    try {
      await c.query('rollback');
    } catch {
      /* tx already aborted */
    }
    c.release();
  }
}

// Is a row with `col = id` visible to this staff context? (table/col are fixed constants.)
async function sees(staffId, table, col, id) {
  return asStaff(staffId, async (c) => {
    const r = await c.query(`select count(*)::int as n from ${table} where ${col} = $1`, [id]);
    return r.rows[0].n > 0;
  });
}

async function seedTenant(slug, name) {
  const t = (
    await owner.query(
      `insert into tenants (name, slug, timezone) values ($1, $2, 'Africa/Lagos') returning id`,
      [name, slug],
    )
  ).rows[0].id;
  const staffId = (
    await owner.query(
      `insert into staff (tenant_id, name, email, role) values ($1, $2, $3, 'admin') returning id`,
      [t, `${name} Admin`, `iso-admin-${slug}@example.invalid`],
    )
  ).rows[0].id;
  const childId = (
    await owner.query(
      `insert into children (tenant_id, first_name, last_name, guardian_name, guardian_phone, health_details, home_address)
       values ($1, 'ZZ', 'Iso', 'Guardian', '000', 'peanut allergy', '1 Test St') returning id`,
      [t],
    )
  ).rows[0].id;
  const pickupId = (
    await owner.query(
      `insert into pickup_persons (tenant_id, child_id, name, relationship) values ($1, $2, 'Pat Pickup', 'Parent') returning id`,
      [t, childId],
    )
  ).rows[0].id;
  const tagId = (
    await owner.query(
      `insert into tags (tenant_id, code, child_id) values ($1, 'ISO-001', $2) returning id`,
      [t, childId],
    )
  ).rows[0].id;
  const dayId = (
    await owner.query(
      `insert into event_days (tenant_id, day_number, starts_at, ends_at) values ($1, 1, now(), now() + interval '8 hours') returning id`,
      [t],
    )
  ).rows[0].id;
  await owner.query(
    `insert into attendance_log (tenant_id, child_id, event_day_id, action, staff_id) values ($1, $2, $3, 'check_in', $4)`,
    [t, childId, dayId, staffId],
  );
  await owner.query(
    `insert into medical_notes (tenant_id, child_id, event_day_id, severity, note_text, author_staff_id) values ($1, $2, $3, 'routine', 'iso note', $4)`,
    [t, childId, dayId, staffId],
  );
  return { t, staffId, childId, pickupId, tagId, dayId };
}

async function cleanup() {
  // Delete the throwaway tenants' rows in FK-safe order; disable append-only triggers for
  // the two immutable tables so the one-time test teardown can remove its rows.
  const ids = (
    await owner.query(`select id from tenants where slug in ('iso-test-a', 'iso-test-b')`)
  ).rows.map((r) => r.id);
  if (ids.length === 0) return;
  for (const tbl of APPEND_ONLY) {
    await owner.query(`alter table ${tbl} disable trigger ${tbl}_append_only`);
  }
  try {
    for (const tbl of ['attendance_log', 'medical_notes', 'pickup_persons', 'tags', 'children', 'event_days', 'staff']) {
      await owner.query(`delete from ${tbl} where tenant_id = any($1)`, [ids]);
    }
  } finally {
    for (const tbl of APPEND_ONLY) {
      await owner.query(`alter table ${tbl} enable trigger ${tbl}_append_only`);
    }
  }
  await owner.query(`delete from tenants where id = any($1)`, [ids]);
}

async function main() {
  await cleanup(); // idempotent: clear any leftovers from a prior aborted run
  const a = await seedTenant('iso-test-a', 'Iso Test A');
  const b = await seedTenant('iso-test-b', 'Iso Test B');

  console.log('\nRead isolation (tenant A cannot see tenant B):');
  ok('A sees its own child', await sees(a.staffId, 'children', 'id', a.childId));
  ok('A CANNOT see tenant B child', !(await sees(a.staffId, 'children', 'id', b.childId)));
  ok('A CANNOT see tenant B child via children_card view', !(await sees(a.staffId, 'children_card', 'id', b.childId)));
  ok('A sees its own tag', await sees(a.staffId, 'tags', 'id', a.tagId));
  ok('A CANNOT see tenant B tag', !(await sees(a.staffId, 'tags', 'id', b.tagId)));
  ok('A sees its own pickup person', await sees(a.staffId, 'pickup_persons', 'id', a.pickupId));
  ok('A CANNOT see tenant B pickup person', !(await sees(a.staffId, 'pickup_persons', 'id', b.pickupId)));
  ok('A sees its own event day', await sees(a.staffId, 'event_days', 'id', a.dayId));
  ok('A CANNOT see tenant B event day', !(await sees(a.staffId, 'event_days', 'id', b.dayId)));
  ok('A sees its own attendance', await sees(a.staffId, 'attendance_log', 'child_id', a.childId));
  ok('A CANNOT see tenant B attendance', !(await sees(a.staffId, 'attendance_log', 'child_id', b.childId)));
  ok('A sees its own medical note', await sees(a.staffId, 'medical_notes', 'child_id', a.childId));
  ok('A CANNOT see tenant B medical note', !(await sees(a.staffId, 'medical_notes', 'child_id', b.childId)));
  ok('A sees its own staff', await sees(a.staffId, 'staff', 'id', a.staffId));
  ok('A CANNOT see tenant B staff', !(await sees(a.staffId, 'staff', 'id', b.staffId)));
  ok('A sees its own tenant row', await sees(a.staffId, 'tenants', 'id', a.t));
  ok('A CANNOT see tenant B tenant row', !(await sees(a.staffId, 'tenants', 'id', b.t)));

  console.log('\nRead isolation (symmetric — tenant B cannot see tenant A):');
  ok('B sees its own child', await sees(b.staffId, 'children', 'id', b.childId));
  ok('B CANNOT see tenant A child', !(await sees(b.staffId, 'children', 'id', a.childId)));
  ok('B CANNOT see tenant A medical note', !(await sees(b.staffId, 'medical_notes', 'child_id', a.childId)));

  console.log('\nFail closed (no staff context → 0 rows):');
  ok('No context: children invisible', !(await sees(null, 'children', 'id', a.childId)));
  ok('No context: medical_notes invisible', !(await sees(null, 'medical_notes', 'child_id', a.childId)));
  ok('No context: staff invisible', !(await sees(null, 'staff', 'id', a.staffId)));
  ok('No context: tenants invisible', !(await sees(null, 'tenants', 'id', a.t)));

  console.log('\nWrite isolation (tenant A cannot write across the boundary):');
  let threw = false;
  await asStaff(a.staffId, async (c) => {
    try {
      await c.query(
        `insert into children (tenant_id, first_name, last_name, guardian_name, guardian_phone) values ($1, 'x', 'y', 'g', '0')`,
        [b.t],
      );
    } catch {
      threw = true;
    }
  });
  ok('A CANNOT INSERT a child into tenant B (WITH CHECK blocks forged tenant_id)', threw);

  threw = false;
  await asStaff(a.staffId, async (c) => {
    try {
      await c.query(
        `insert into medical_notes (tenant_id, child_id, event_day_id, severity, note_text) values ($1, $2, $3, 'routine', 'x')`,
        [b.t, a.childId, a.dayId],
      );
    } catch {
      threw = true;
    }
  });
  ok('A CANNOT INSERT a medical note into tenant B', threw);

  await asStaff(a.staffId, async (c) => {
    const r = await c.query(
      `insert into children (first_name, last_name, guardian_name, guardian_phone) values ('x', 'y', 'g', '0') returning tenant_id`,
    );
    ok('A insert WITHOUT tenant_id auto-stamps tenant A', r.rows[0].tenant_id === a.t, r.rows[0].tenant_id);
  });

  await asStaff(a.staffId, async (c) => {
    const u = await c.query(`update children set first_name = 'hacked' where id = $1`, [b.childId]);
    ok('A UPDATE of tenant B child affects 0 rows', u.rowCount === 0, `rowCount=${u.rowCount}`);
  });
  await asStaff(a.staffId, async (c) => {
    const d = await c.query(`delete from children where id = $1`, [b.childId]);
    ok('A DELETE of tenant B child affects 0 rows', d.rowCount === 0, `rowCount=${d.rowCount}`);
  });

  console.log('\nSchema meta-guard (catches a future un-scoped table/policy):');
  const rls = (
    await owner.query(`select relname, relrowsecurity from pg_class where relname = any($1)`, [
      [...TENANT_TABLES, 'tenants'],
    ])
  ).rows;
  for (const row of rls) ok(`RLS enabled on ${row.relname}`, row.relrowsecurity === true);

  const pol = (
    await owner.query(
      `select tablename, policyname, coalesce(qual, '') || ' ' || coalesce(with_check, '') as expr
       from pg_policies where schemaname = 'public' and tablename = any($1)`,
      [[...TENANT_TABLES, 'tenants']],
    )
  ).rows;
  ok('every tenant table has at least one policy', pol.length > 0, `found ${pol.length}`);
  for (const row of pol) {
    ok(
      `policy ${row.tablename}.${row.policyname} references app_tenant_id()`,
      /app_tenant_id/.test(row.expr),
      row.expr.trim(),
    );
  }
}

let exitCode = 0;
try {
  await main();
} catch (err) {
  console.error('\nSuite crashed:', err);
  exitCode = 1;
} finally {
  try {
    await cleanup();
  } catch (err) {
    console.error('Cleanup failed:', err);
    exitCode = 1;
  }
  await app.end();
  await owner.end();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) exitCode = 1;
process.exit(exitCode);
