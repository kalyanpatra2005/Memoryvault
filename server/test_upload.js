async function testUpload() {
  console.log('--- TESTING SECURE FILE UPLOAD & PERMANENCE ---');
  const runId = Date.now();

  // 1. Register test user
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Photographer John',
      email: `john_${runId}@vault.test`,
      phone: `+1555${String(runId).slice(-7)}`,
      dob: '1992-07-15',
      password: 'johnSecretPassword',
      confirmPassword: 'johnSecretPassword'
    })
  });
  const regData = await regRes.json();
  const token = regData.token;
  console.log('✓ Test user registered:', regData.user.name);

  // 2. Create mock image file
  const mockImageContent = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
  const blob = new Blob([mockImageContent], { type: 'image/gif' });
  const formData = new FormData();
  formData.append('files', blob, 'vintage_memory.gif');
  formData.append('caption', 'A rainy autumn sunset from 10 years ago');

  // 3. Upload to /api/media/upload
  const uploadRes = await fetch('http://localhost:5000/api/media/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const uploadData = await uploadRes.json();
  if (uploadRes.status !== 201 || !uploadData.media || uploadData.media.length === 0) {
    throw new Error('Upload failed: ' + JSON.stringify(uploadData));
  }
  const uploadedItem = uploadData.media[0];
  console.log('✓ Upload succeeded: ID =', uploadedItem.id, 'Media type =', uploadedItem.media_type);

  // 4. Stream photo back using auth token
  const streamRes = await fetch(`http://localhost:5000/api/media/stream/${uploadedItem.id}?token=${token}`);
  if (streamRes.status !== 200) {
    throw new Error('Streaming failed with status: ' + streamRes.status);
  }
  const arrayBuffer = await streamRes.arrayBuffer();
  console.log('✓ Authenticated stream retrieved successfully (bytes =', arrayBuffer.byteLength, ')');

  // 5. Verify unauthenticated request fails (401)
  const unauthRes = await fetch(`http://localhost:5000/api/media/stream/${uploadedItem.id}`);
  if (unauthRes.status === 401) {
    console.log('✓ High Security verified: Unauthenticated request rejected with 401 Unauthorized');
  } else {
    throw new Error('Security flaw! Unauthenticated access was permitted: ' + unauthRes.status);
  }

  // 6. Verify cross-user request fails (403)
  const userBRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Intruder Bob',
      email: `bob_${runId}@vault.test`,
      phone: `+15559${String(runId).slice(-6)}`,
      dob: '1990-01-01',
      password: 'bobSecretPassword',
      confirmPassword: 'bobSecretPassword'
    })
  });
  const userBData = await userBRes.json();
  const intruderStream = await fetch(`http://localhost:5000/api/media/stream/${uploadedItem.id}?token=${userBData.token}`);
  if (intruderStream.status === 403) {
    console.log('✓ High Security verified: Cross-user access rejected with 403 Forbidden');
  } else {
    throw new Error('Security flaw! Cross-user access was permitted: ' + intruderStream.status);
  }

  console.log('\n🎉 ALL MEDIA & SECURITY UPLOAD TESTS PASSED SUCCESSFULLY!');
}

testUpload().catch(err => {
  console.error('UPLOAD TEST FAILED:', err);
  process.exit(1);
});
