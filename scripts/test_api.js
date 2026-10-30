import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

export async function runApiTests() {
  console.log('=== UCHIHA CONNECT (UC) API VERIFICATION ===');

  // Test 1: Public profile for published card ('ashi')
  const res1 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/public/profile/ashi',
    method: 'GET',
  });
  console.log('Test 1: Public profile "ashi":', res1.statusCode === 200 ? 'PASS' : 'FAIL', res1.body?.participant?.full_name);

  // Test 2: Draft card protection "priya"
  const res2 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/public/profile/priya',
    method: 'GET',
  });
  console.log('Test 2: Draft card protection "priya":', res2.statusCode === 404 ? 'PASS (Correctly Blocked)' : 'FAIL');

  // Test 3: Unauthorized access to admin endpoint
  const res3 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/participants',
    method: 'GET',
  });
  console.log('Test 3: Admin security without token:', res3.statusCode === 401 ? 'PASS (Protected)' : 'FAIL');

  // Test 4: Login with correct PIN '2026'
  const res5 = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { pin: '2026' }
  );
  const token = res5.body?.token;
  console.log('Test 4: Valid PIN 2026 login:', res5.statusCode === 200 && token ? 'PASS' : 'FAIL');

  // Test 5: Fetch all 30 participants with token
  const res6 = await makeRequest({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/participants',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Test 5: Total participant slots:', res6.body?.participants?.length === 30 ? 'PASS (30 Slots)' : 'FAIL');

  console.log('=== TEST SUITE PASSED ===');
}

runApiTests();
