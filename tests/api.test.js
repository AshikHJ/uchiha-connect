import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';

test('organizer and public card lifecycle', async t => {
  fs.mkdirSync('.test-tmp', { recursive: true });
  const directory = fs.mkdtempSync(path.resolve('.test-tmp', 'uc-api-'));
  process.env.DB_FILE = path.join(directory, 'db.json');
  process.env.SESSION_SECRET = 'test-only-secret-with-at-least-thirty-two-characters';
  process.env.NODE_ENV = 'test';
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.VERCEL;
  delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  process.env.ORGANIZER_PIN = '2026';
  const { default: app } = await import('../api/index.js');
  const server = http.createServer(app).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let token;
  async function request(route, method = 'GET', body, auth = token, headers = {}) {
    const response = await fetch(base + route, { method, headers: {
      'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...headers,
    }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, headers: response.headers, body: await response.json() };
  }
  try {
    await t.test('API health and unpublished cards', async () => {
      assert.equal((await request('/api/health')).status, 200);
      assert.equal((await request('/api/public/profile/ashi')).status, 200);
      assert.equal((await request('/api/public/profile/priya')).status, 404);
      assert.equal((await request('/api/participants')).status, 401);
    });
    await t.test('login, secure cookie flags and alternate serverless path', async () => {
      const invalid = await request('/api/auth/login', 'POST', { pin: '0000' });
      assert.equal(invalid.status, 401);
      assert.equal(invalid.body.attemptsLeft, 4);
      const login = await request('/auth/login', 'POST', { pin: '2026' });
      assert.equal(login.status, 200);
      assert.match(login.headers.get('set-cookie'), /HttpOnly/);
      assert.match(login.headers.get('set-cookie'), /SameSite=Lax/);
      token = login.body.token;
      assert.equal((await request('/api/auth/status')).body.isAuthenticated, true);
      assert.equal((await request('/api/participants')).body.participants.length, 30);
    });
    await t.test('create, save design, publish and unpublish', async () => {
      const created = await request('/api/participants', 'POST', { full_name: 'Regression Test', username: 'regression' });
      assert.equal(created.status, 201);
      const id = created.body.participant_id;
      assert.equal((await request('/api/public/profile/regression')).status, 404);
      const design = { canvas: { width: 420, height: 680, background: '#ffffff' }, theme: { fontFamily: 'Inter', borderRadius: 24 },
        elements: [{ id: 'custom-heading', type: 'text', x: 30, y: 95, width: 340, height: 40, content: 'Custom saved heading', style: { fontSize: 27 } }] };
      assert.equal((await request(`/api/participants/${id}`, 'PUT', { design_json: design })).status, 200);
      assert.equal((await request(`/api/participants/${id}/publish`, 'POST')).status, 200);
      const published = await request('/api/public/profile/regression');
      assert.deepEqual(published.body.participant.design_json, design);
      const disk = JSON.parse(fs.readFileSync(process.env.DB_FILE, 'utf8'));
      assert.deepEqual(disk.data.participants.find(p => p.participant_id === id).design_json, design);
      assert.equal((await request(`/api/participants/${id}/unpublish`, 'POST')).status, 200);
      assert.equal((await request('/api/public/profile/regression')).status, 404);
    });
    await t.test('protect slot identity and reject malformed input', async () => {
      const result = await request('/api/participants/CID-004', 'PUT', { participant_id: 'CID-001', slot_number: 99, full_name: 'Still slot four' });
      assert.equal(result.body.participant_id, 'CID-004');
      assert.equal(result.body.slot_number, 4);
      assert.equal((await request('/api/participants', 'POST', { full_name: 'Overwrite', slot_number: 4 })).status, 409);
      assert.equal((await request('/api/participants', 'POST', { full_name: 123 })).status, 400);
      assert.equal((await request('/api/participants/CID-004', 'PUT', { username: '../bad' })).status, 400);
      assert.equal((await request('/api/participants/CID-004', 'PUT', { design_json: { elements: [] } })).status, 400);
      assert.equal((await request('/api/participants/CID-005/publish', 'POST')).status, 400);
      assert.equal((await request('/api/participants/CID-005', 'PUT', { publication_status: 'published' })).status, 400);
    });
    await t.test('reject foreign origins, allow Vite origin and preserve preflight', async () => {
      assert.equal((await request('/api/auth/status', 'GET', undefined, token, { Origin: 'https://untrusted.example' })).status, 403);
      assert.equal((await request('/api/auth/status', 'GET', undefined, token, { Origin: 'http://localhost:5173' })).status, 200);
      const response = await fetch(base + '/api/auth/login', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' } });
      assert.equal(response.status, 204);
    });
    await t.test('settings responses do not expose PIN hashes', async () => {
      const result = await request('/api/settings', 'PUT', { hackathonName: 'Regression Event' });
      assert.equal(result.status, 200);
      assert.equal(result.body.config.organizerPinHash, undefined);
      assert.equal(result.body.config.organizerPinSalt, undefined);
    });
    await t.test('reject forged and future-dated sessions', async () => {
      assert.equal((await request('/api/participants', 'GET', undefined, token + 'x')).status, 401);
      const db = JSON.parse(fs.readFileSync(process.env.DB_FILE, 'utf8')).data;
      const payload = Buffer.from(JSON.stringify({ user: 'organizer', issued: Date.now() + 86400000, authVersion: db.config.authVersion })).toString('base64url');
      const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('hex');
      assert.equal((await request('/api/participants', 'GET', undefined, `${payload}.${signature}`)).status, 401);
    });
    await t.test('PIN rotation invalidates previous sessions', async () => {
      assert.equal((await request('/api/auth/change-pin', 'POST', { newPin: '123456' })).status, 400);
      const changed = await request('/api/auth/change-pin', 'POST', { currentPin: '2026', newPin: '654321' });
      assert.equal(changed.status, 200);
      assert.equal((await request('/api/participants')).status, 401);
      token = decodeURIComponent(changed.headers.get('set-cookie').split(';')[0].split('=')[1]);
      assert.equal((await request('/api/participants')).status, 200);
    });
    await t.test('logout revokes bearer tokens as well as cookies', async () => {
      assert.equal((await request('/api/auth/logout', 'POST')).status, 200);
      assert.equal((await request('/api/participants')).status, 401);
    });
    await t.test('rate limiter returns a countdown and cannot be bypassed with forwarded headers', async () => {
      for (let i = 0; i < 3; i++) assert.equal((await request('/api/auth/login', 'POST', { pin: '0000' })).status, 401);
      const limited = await request('/api/auth/login', 'POST', { pin: '654321' }, undefined, { 'X-Forwarded-For': '198.51.100.1' });
      assert.equal(limited.status, 429);
      assert.ok(limited.body.lockoutRemaining > 0);
      assert.ok(Number(limited.headers.get('retry-after')) > 0);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
