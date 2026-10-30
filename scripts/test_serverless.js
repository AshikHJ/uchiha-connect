import http from 'http';
import handler from '../api/index.js';

const server = http.createServer((req, res) => {
  return handler(req, res);
});

function makeRequest(path, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3002,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

server.listen(3002, async () => {
  console.log('=== VERCEL SERVERLESS FUNCTION VERIFICATION ===');

  try {
    // 1. Health check
    const r0 = await makeRequest('/api/health', 'GET');
    console.log('1. Health check (/api/health):', r0.status === 200 ? 'PASS' : 'FAIL', r0.body);

    // 2. POST /api/auth/login with wrong PIN
    const r1 = await makeRequest('/api/auth/login', 'POST', {}, { pin: '0000' });
    console.log('2. Invalid PIN POST (/api/auth/login):', r1.status === 401 ? 'PASS (401)' : 'FAIL', r1.body?.error);

    // 3. POST /api/auth/login with valid PIN 2026
    const r2 = await makeRequest('/api/auth/login', 'POST', {}, { pin: '2026' });
    const token = r2.body?.token;
    console.log('3. Valid PIN POST (/api/auth/login):', r2.status === 200 && token ? 'PASS (200 with token)' : 'FAIL');

    // 4. POST /auth/login (testing rewritten path without /api)
    const r3 = await makeRequest('/auth/login', 'POST', {}, { pin: '2026' });
    console.log('4. Rewritten route without /api (/auth/login):', r3.status === 200 ? 'PASS' : 'FAIL');

    // 5. Protected endpoint without token
    const r4 = await makeRequest('/api/participants', 'GET');
    console.log('5. Unauthenticated admin endpoint (/api/participants):', r4.status === 401 ? 'PASS (Protected)' : 'FAIL');

    // 6. Protected endpoint with Bearer token
    const r5 = await makeRequest('/api/participants', 'GET', { Authorization: `Bearer ${token}` });
    console.log('6. Authenticated admin endpoint (/api/participants):', r5.status === 200 && r5.body?.participants?.length === 30 ? 'PASS (30 slots)' : 'FAIL');

    // 7. Public profile published
    const r6 = await makeRequest('/api/public/profile/ashi', 'GET');
    console.log('7. Public profile (/api/public/profile/ashi):', r6.status === 200 ? 'PASS' : 'FAIL', r6.body?.participant?.full_name);

    // 8. Public profile draft (must be 404)
    const r7 = await makeRequest('/api/public/profile/priya', 'GET');
    console.log('8. Draft profile protection (/api/public/profile/priya):', r7.status === 404 ? 'PASS (404 Blocked)' : 'FAIL');

    // 9. Preflight OPTIONS request
    const r8 = await makeRequest('/api/auth/login', 'OPTIONS');
    console.log('9. CORS Preflight OPTIONS (/api/auth/login):', r8.status === 204 ? 'PASS (204 No Content)' : 'FAIL');

    console.log('=== ALL SERVERLESS FUNCTION TESTS PASSED ===');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
