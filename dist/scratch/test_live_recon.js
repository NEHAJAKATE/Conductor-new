async function testLiveRecon() {
    // 1. Get Owner Session
    const ownerSess = await fetch('http://localhost:3000/api/v1/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'OWNER' })
    }).then(r => r.json());
    console.log('1. Owner Session Generated:', !!ownerSess.token);
    // 2. Fetch Reconciliation as Owner
    const reconRes = await fetch('http://localhost:3000/api/v1/reconciliation', {
        headers: { 'Authorization': `Bearer ${ownerSess.token}` }
    });
    console.log('2. Owner Recon HTTP Status:', reconRes.status);
    const reconData = await reconRes.json();
    console.log(`   Owner Recon Data: Matched = ${reconData.matchedCount}, Unmatched = ${reconData.unmatchedCount}, Mismatch = ${reconData.mismatchCount}`);
    // 3. Get Staff Session
    const staffSess = await fetch('http://localhost:3000/api/v1/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'STAFF' })
    }).then(r => r.json());
    console.log('3. Staff Session Generated:', !!staffSess.token);
    // 4. Fetch Reconciliation as Staff
    const staffRes = await fetch('http://localhost:3000/api/v1/reconciliation', {
        headers: { 'Authorization': `Bearer ${staffSess.token}` }
    });
    console.log('4. Staff Recon HTTP Status (Should be 403):', staffRes.status);
    const staffErr = await staffRes.json();
    console.log('   Staff Response:', staffErr.message);
}
testLiveRecon().catch(console.error);
