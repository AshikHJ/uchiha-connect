import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('migration installs private storage and atomic rate limiting in PostgreSQL', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    const migration = fs.readFileSync(new URL('../supabase/migrations/002_persistent_state.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    // Re-applying the migration must be safe.
    await db.exec(migration);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(db.query('SELECT * FROM public.uc_app_state'), /permission denied/);
      await assert.rejects(db.query("SELECT public.uc_consume_login_attempt('ip')"), /permission denied/);
      await db.exec('RESET ROLE');
    }
    await db.exec('SET ROLE service_role');
    await db.query("INSERT INTO public.uc_app_state (id, data) VALUES ('primary', $1)", [{ config: { organizerPinHash: 'private' }, participants: [] }]);
    assert.equal((await db.query('SELECT data FROM public.uc_app_state')).rows[0].data.config.organizerPinHash, 'private');
    const update = await db.query("UPDATE public.uc_app_state SET revision = 1 WHERE id = 'primary' AND revision = 0 RETURNING revision");
    assert.equal(update.rows.length, 1);
    assert.equal((await db.query("UPDATE public.uc_app_state SET revision = 2 WHERE id = 'primary' AND revision = 0 RETURNING revision")).rows.length, 0);
    for (let i = 0; i < 5; i++) {
      const { rows } = await db.query('SELECT public.uc_consume_login_attempt($1) AS result', ['ip']);
      assert.equal(rows[0].result.allowed, true);
      assert.equal(rows[0].result.attemptsLeft, 4 - i);
    }
    const locked = (await db.query("SELECT public.uc_consume_login_attempt('ip') AS result")).rows[0].result;
    assert.equal(locked.allowed, false);
    assert.ok(locked.lockoutRemaining > 0 && locked.lockoutRemaining <= 900);
    await db.query("UPDATE public.uc_login_attempts SET expires_at = now() - interval '1 second' WHERE key = 'ip'");
    const reset = (await db.query("SELECT public.uc_consume_login_attempt('ip') AS result")).rows[0].result;
    assert.equal(reset.allowed, true);
    assert.equal(reset.attemptsLeft, 4);
  } finally { await db.close(); }
});
