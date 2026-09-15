const http = require('http');

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING MEMORY VAULT COMPREHENSIVE TESTS ---');
  let testsPassed = 0;
  const runId = Date.now();

  // 1. Health check
  const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  if (health.status === 200 && health.body.status === 'ok') {
    console.log('✓ Health check passed');
    testsPassed++;
  } else {
    throw new Error('Health check failed: ' + JSON.stringify(health));
  }

  // 2. Register User A
  const emailA = `elena_${runId}@vault.test`;
  const phoneA = `+1555${String(runId).slice(-7)}`;
  const regA = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Elena Rostova',
    email: emailA,
    phone: phoneA,
    dob: '1998-04-12',
    password: 'secretPassword123',
    confirmPassword: 'secretPassword123'
  });

  if (regA.status === 201 && regA.body.token && regA.body.user.name === 'Elena Rostova') {
    console.log('✓ User A Registration passed (all fields: name, email, phone, dob, password, confirmPassword)');
    testsPassed++;
  } else {
    throw new Error('User A registration failed: ' + JSON.stringify(regA));
  }

  const tokenA = regA.body.token;

  // 3. Password mismatch validation test
  const regMismatch = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Test Fail',
    email: 'fail@vault.test',
    phone: '+15559999999',
    dob: '2000-01-01',
    password: 'passwordA',
    confirmPassword: 'passwordB'
  });

  if (regMismatch.status === 400 && regMismatch.body.error.includes('match')) {
    console.log('✓ Password mismatch prevention passed');
    testsPassed++;
  } else {
    throw new Error('Password mismatch test failed: ' + JSON.stringify(regMismatch));
  }

  // 4. Login with Email + Name + Password
  const loginEmail = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    identifier: emailA,
    name: 'Elena Rostova',
    password: 'secretPassword123'
  });

  if (loginEmail.status === 200 && loginEmail.body.token) {
    console.log('✓ Login with Email + Name + Password passed');
    testsPassed++;
  } else {
    throw new Error('Login with Email failed: ' + JSON.stringify(loginEmail));
  }

  // 5. Login with Phone + Name + Password
  const loginPhone = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    identifier: phoneA,
    name: 'Elena Rostova',
    password: 'secretPassword123'
  });

  if (loginPhone.status === 200 && loginPhone.body.token) {
    console.log('✓ Login with Phone + Name + Password passed');
    testsPassed++;
  } else {
    throw new Error('Login with Phone failed: ' + JSON.stringify(loginPhone));
  }

  // 6. User A creates Tragic Diary Entry
  const diaryRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/diary',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    title: 'The Rain on the Window',
    content: 'Some things are never meant to be retrieved. Yet the ink holds fast what the heart cannot speak aloud.',
    mood: 'Bittersweet',
    weather: 'Rainy Night'
  });

  if (diaryRes.status === 201 && diaryRes.body.entry.id) {
    console.log('✓ Tragic Diary entry creation passed');
    testsPassed++;
  } else {
    throw new Error('Diary creation failed: ' + JSON.stringify(diaryRes));
  }

  const diaryIdA = diaryRes.body.entry.id;

  // 7. User A creates Time Capsule
  const futureDate = new Date(Date.now() + 86400000 * 365).toISOString(); // 1 year from now
  const capsuleRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/capsules',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    title: 'Letter to Future Elena',
    message: 'Did you find peace in the choices you made?',
    unlock_date: futureDate
  });

  if (capsuleRes.status === 201 && capsuleRes.body.capsule.id) {
    console.log('✓ Time Capsule creation with future unlock date passed');
    testsPassed++;
  } else {
    throw new Error('Capsule creation failed: ' + JSON.stringify(capsuleRes));
  }

  // 8. Register User B (to verify strict privacy and isolation)
  const regB = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Marcus Gray',
    email: `marcus_${runId}@vault.test`,
    phone: `+15558${String(runId).slice(-6)}`,
    dob: '1995-10-20',
    password: 'marcusPassword99',
    confirmPassword: 'marcusPassword99'
  });

  const tokenB = regB.body.token;

  // 9. Verify User B CANNOT see User A's diaries or capsules (Privacy Check)
  const diariesB = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/diary',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });

  if (diariesB.status === 200 && diariesB.body.entries.length === 0) {
    console.log('✓ User Isolation Privacy Guarantee passed (User B sees 0 of User A\'s diaries)');
    testsPassed++;
  } else {
    throw new Error('Privacy leak! User B saw entries: ' + JSON.stringify(diariesB));
  }

  // 10. Verify User B CANNOT delete or access User A's diary
  const deleteAttemptByB = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/diary/${diaryIdA}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });

  if (deleteAttemptByB.status === 404) {
    console.log('✓ Cross-user unauthorized modification prevention passed (404/denied)');
    testsPassed++;
  } else {
    throw new Error('Unauthorized modification was not blocked: ' + JSON.stringify(deleteAttemptByB));
  }

  // 11. Check User A's Vault Stats
  const statsA = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });

  if (statsA.status === 200 && statsA.body.diaries === 1 && statsA.body.capsules === 1) {
    console.log('✓ Vault Stats aggregation passed');
    testsPassed++;
  } else {
    throw new Error('Stats check failed: ' + JSON.stringify(statsA));
  }

  console.log(`\n🎉 ALL ${testsPassed} INTEGRATION TESTS PASSED SUCCESSFULLY!`);
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
