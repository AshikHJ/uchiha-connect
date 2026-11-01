import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { createStore } from '../server/store.js';

const run = (store, task) => store.middleware(null, null, task);
test('local writes survive a fresh process and stale writes fail', async () => {
  fs.mkdirSync('.test-tmp', { recursive: true });
  const dir = fs.mkdtempSync(path.resolve('.test-tmp', 'uc-store-'));
  const filename = path.join(dir, 'state.json');
  const store = createStore({ filename, initialize: () => ({ value: 0 }) });
  try {
    await run(store, async () => { const db = await store.read(); db.value = 42; await store.write(db); });
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import fs from 'node:fs'; console.log(JSON.parse(fs.readFileSync(process.argv[1], 'utf8')).data.value)`, filename], { encoding: 'utf8' });
    assert.equal(child.status, 0);
    assert.equal(child.stdout.trim(), '42');
    let release;
    const barrier = new Promise(resolve => { release = resolve; });
    const stale = run(store, async () => { const db = await store.read(); await barrier; await assert.rejects(store.write(db), { status: 409 }); });
    await run(store, async () => { const db = await store.read(); db.value = 43; await store.write(db); });
    release(); await stale;
    await run(store, async () => assert.equal((await store.read()).value, 43));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('Supabase protocol: shared persistence, compare-and-swap, RPC throttling, and storage failures', async () => {
  // Exercise the actual Supabase JS client against a controlled PostgREST fixture.
  // A live project's RLS and SQL installation still require deployment verification.
  let row = null;
  let count = 0;
  let unavailable = false;
  const server = http.createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('Content-Type', 'application/json');
    if (unavailable) { res.statusCode = 503; res.end(JSON.stringify({ message: 'offline' })); return; }
    if (url.pathname.endsWith('/rpc/uc_consume_login_attempt')) {
      count++;
      res.end(JSON.stringify({ allowed: count <= 5, attemptsLeft: Math.max(0, 5 - count), lockoutRemaining: 900 })); return;
    }
    if (req.method === 'POST') { row ||= body; res.end('[]'); return; }
    if (req.method === 'PATCH') {
      if (url.searchParams.get('revision') === `eq.${row.revision}`) { row = { ...row, ...body }; res.end(JSON.stringify([{ revision: row.revision }])); }
      else res.end('[]');
      return;
    }
    res.end(JSON.stringify(row));
  });
  server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const options = { supabaseUrl: `http://127.0.0.1:${server.address().port}`, serviceKey: 'test-service-role', initialize: () => ({ value: 0 }) };
  const first = createStore(options); const second = createStore(options);
  try {
    await run(first, async () => { const db = await first.read(); db.value = 10; await first.write(db); });
    await run(second, async () => assert.equal((await second.read()).value, 10));
    let release;
    const barrier = new Promise(resolve => { release = resolve; });
    let readDone;
    const ready = new Promise(resolve => { readDone = resolve; });
    const stale = run(first, async () => { const db = await first.read(); readDone(); await barrier; await assert.rejects(first.write(db), { status: 409 }); });
    await ready;
    await run(second, async () => { const db = await second.read(); db.value = 11; await second.write(db); });
    release(); await stale;
    for (let i = 0; i < 5; i++) assert.equal((await (i % 2 ? first : second).consumeLoginAttempt('same-ip')).allowed, true);
    assert.equal((await first.consumeLoginAttempt('same-ip')).allowed, false);
    unavailable = true;
    await assert.rejects(run(first, () => first.read()));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
