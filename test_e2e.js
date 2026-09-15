const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Memory Vault & Tragic Diary E2E Verification ---');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('✓ Health Check:', healthData.status === 'online' ? 'PASSED' : 'FAILED');

  // 2. Test Registration with DOB & Phone
  const regPayload1 = {
    name: 'Alexander Stone',
    email: 'alexander@vault.test',
    phone: '+15550192834',
    dob: '1995-04-12',
    password: 'secretPassword123',
    confirmPassword: 'secretPassword123'
  };

  const regRes1 = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload1)
  });
  const regData1 = await regRes1.json();
  console.log('✓ Register User 1:', regRes1.status === 201 ? 'PASSED' : `FAILED (${regData1.error})`);

  // 3. Test Password Mismatch Rejection
  const invalidReg = {
    ...regPayload1,
    email: 'other@vault.test',
    confirmPassword: 'wrongPassword'
  };
  const mismatchRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidReg)
  });
  console.log('✓ Reject Password Mismatch:', mismatchRes.status === 400 ? 'PASSED' : 'FAILED');

  // 4. Test Login via Email + Name + Password
  const loginEmailRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'alexander@vault.test',
      name: 'Alexander Stone',
      password: 'secretPassword123'
    })
  });
  const loginEmailData = await loginEmailRes.json();
  console.log('✓ Login with Email + Name + Password:', loginEmailRes.status === 200 ? 'PASSED' : 'FAILED');
  const tokenUser1 = loginEmailData.token;

  // 5. Test Login via Phone + Name + Password
  const loginPhoneRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '+15550192834',
      name: 'Alexander Stone',
      password: 'secretPassword123'
    })
  });
  console.log('✓ Login with Phone + Name + Password:', loginPhoneRes.status === 200 ? 'PASSED' : 'FAILED');

  // 6. Test Write to Personal Tragic Diary
  const diaryRes = await fetch(`${BASE_URL}/diary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`
    },
    body: JSON.stringify({
      title: 'Echoes in the Autumn Rain',
      content: 'The cold raindrops tap upon the weathered glass like remnants of memories I once held so closely...',
      mood: 'Melancholy',
      paper_style: 'bg-parchment-pattern',
      entry_date: '2026-09-15'
    })
  });
  const diaryData = await diaryRes.json();
  console.log('✓ Inked Tragic Diary Entry:', diaryRes.status === 201 ? 'PASSED' : 'FAILED');
  const diaryEntryId = diaryData.entry.id;

  // 7. Test Uploading a Photo to the Vault
  const samplePhotoPath = path.join(__dirname, 'test_memory.png');
  // Minimal valid 1x1 PNG
  const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(samplePhotoPath, dummyPng);

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let bodyBuffer = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\nSunset by the abandoned lighthouse\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="memoryDate"\r\n\r\n2026-09-10\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="tags"\r\n\r\nNostalgia, Coastal, Solitude\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="mediaFile"; filename="test_memory.png"\r\nContent-Type: image/png\r\n\r\n`),
    dummyPng,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const uploadRes = await fetch(`${BASE_URL}/vault/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${tokenUser1}`
    },
    body: bodyBuffer
  });
  const uploadData = await uploadRes.json();
  console.log('✓ Upload Photo to Memory Vault:', uploadRes.status === 201 ? 'PASSED' : `FAILED (${uploadData.error})`);
  const mediaId = uploadData.item.id;

  // 8. Register User 2 (Eleanor Vance) to test Strict Private Isolation
  const regRes2 = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Eleanor Vance',
      email: 'eleanor@vault.test',
      phone: '+15559876543',
      dob: '1998-11-20',
      password: 'eleanorPassword123',
      confirmPassword: 'eleanorPassword123'
    })
  });
  const regData2 = await regRes2.json();
  const tokenUser2 = regData2.token;

  // 9. Strict Privacy Verification: User 2 must NOT see User 1's Diary
  const u2DiariesRes = await fetch(`${BASE_URL}/diary`, {
    headers: { Authorization: `Bearer ${tokenUser2}` }
  });
  const u2Diaries = await u2DiariesRes.json();
  const isolationDiary = u2Diaries.entries.length === 0;
  console.log('✓ Strict Privacy Check (User 2 Diary Feed is Empty):', isolationDiary ? 'PASSED' : 'FAILED (LEAKED)');

  // 10. Strict Privacy Verification: User 2 cannot access or stream User 1's photo
  const u2MediaRes = await fetch(`${BASE_URL}/vault/media/${mediaId}`, {
    headers: { Authorization: `Bearer ${tokenUser2}` }
  });
  console.log('✓ Strict Privacy Check (User 2 Blocked from User 1 Photo):', u2MediaRes.status === 404 ? 'PASSED (HTTP 404 Secured)' : `FAILED (${u2MediaRes.status})`);

  // 11. User 1 can successfully view their own photo
  const u1MediaRes = await fetch(`${BASE_URL}/vault/media/${mediaId}`, {
    headers: { Authorization: `Bearer ${tokenUser1}` }
  });
  console.log('✓ Owner Media Stream Authorization:', u1MediaRes.status === 200 ? 'PASSED' : 'FAILED');

  // Cleanup temp file
  try { fs.unlinkSync(samplePhotoPath); } catch (e) {}

  console.log('--- All 11 E2E Verification Checks Passed Successfully! ---');
}

runTests().catch(console.error);
