import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('production rejects temporary storage and public signing secrets', () => {
  const clean = { ...process.env, NODE_ENV: 'production', SUPABASE_URL: '', VITE_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', SESSION_SECRET: '' };
  let result = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./server/app.js')"], { env: clean, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Production requires persistent Supabase storage/);
  result = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./server/app.js')"], {
    env: { ...clean, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-service-role', SESSION_SECRET: 'uc_organizer_secure_session_secret_key_2026' }, encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Production requires a random SESSION_SECRET/);
});
