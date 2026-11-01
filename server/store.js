import fs from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient } from '@supabase/supabase-js';

const conflict = () => Object.assign(new Error('Another request changed the data. Reload and try again.'), { status: 409 });

// One private JSON document preserves the existing data format. A revision check
// makes concurrent updates fail explicitly instead of silently losing changes.
export function createStore({ filename, initialize, supabaseUrl, serviceKey, client }) {
  const remote = client || (supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null);
  const context = new AsyncLocalStorage();
  const attempts = new Map();
  function localSnapshot() {
    if (!fs.existsSync(filename)) {
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(filename, JSON.stringify({ revision: 0, data: initialize() }), { flag: 'wx', mode: 0o600 });
    }
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  }
  async function snapshot() {
    if (!remote) return localSnapshot();
    let result = await remote.from('uc_app_state').select('revision,data').eq('id', 'primary').maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) {
      const inserted = await remote.from('uc_app_state').upsert(
        { id: 'primary', revision: 0, data: initialize() }, { onConflict: 'id', ignoreDuplicates: true }
      );
      if (inserted.error) throw inserted.error;
      result = await remote.from('uc_app_state').select('revision,data').eq('id', 'primary').single();
      if (result.error) throw result.error;
    }
    return result.data;
  }
  return {
    middleware: (_req, _res, next) => context.run({}, next),
    async read() {
      const current = await snapshot();
      const request = context.getStore();
      if (!request) throw new Error('Database access requires request context');
      request.revision = current.revision;
      return current.data;
    },
    async write(data) {
      const request = context.getStore();
      if (request?.revision === undefined) throw new Error('Read before writing');
      const revision = request.revision;
      if (remote) {
        const result = await remote.from('uc_app_state').update({ data, revision: revision + 1 })
          .eq('id', 'primary').eq('revision', revision).select('revision');
        if (result.error) throw result.error;
        if (result.data.length !== 1) throw conflict();
      } else {
        if (localSnapshot().revision !== revision) throw conflict();
        const temp = `${filename}.${process.pid}.tmp`;
        fs.writeFileSync(temp, JSON.stringify({ revision: revision + 1, data }, null, 2), { mode: 0o600 });
        fs.renameSync(temp, filename);
      }
      request.revision++;
    },
    async consumeLoginAttempt(key) {
      if (remote) {
        const { data, error } = await remote.rpc('uc_consume_login_attempt', { attempt_key: key });
        if (error) throw error;
        return data;
      }
      const now = Date.now();
      for (const [ip, value] of attempts) if (value.expires <= now) attempts.delete(ip);
      const entry = attempts.get(key) || { count: 0, expires: now + 900000 };
      const allowed = entry.count < 5;
      if (allowed) entry.count++;
      attempts.set(key, entry);
      return { allowed, attemptsLeft: Math.max(0, 5 - entry.count), lockoutRemaining: Math.ceil((entry.expires - now) / 1000) };
    },
  };
}
