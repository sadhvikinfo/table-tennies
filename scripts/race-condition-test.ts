#!/usr/bin/env ts-node
/**
 * Race Condition Test Script
 * Simulates two users trying to lock the same slot at the exact same millisecond.
 * Expected: Exactly one should receive { held: true }, the other { held: false }.
 *
 * Usage: npx ts-node scripts/race-condition-test.ts
 * (Requires the dev server to be running on localhost:3000)
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// First, log in as two different users to get their session cookies
async function getSessionCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  })
  const cookies = res.headers.get('set-cookie')
  return cookies ?? ''
}

async function tryLock(
  tableId: string,
  slotId: string,
  date: string,
  cookie: string
): Promise<{ held: boolean; reason?: string }> {
  const res = await fetch(`${BASE_URL}/api/slots/lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({ tableId, slotId, date }),
  })
  return res.json()
}

async function main() {
  console.log('🏓 TT BookIt — Race Condition Test')
  console.log('=====================================')

  // NOTE: Replace with actual tableId and slotId from your DB
  const tableId = process.env.TEST_TABLE_ID ?? 'YOUR_TABLE_ID'
  const slotId = process.env.TEST_SLOT_ID ?? 'YOUR_SLOT_ID'
  const date = new Date().toISOString().split('T')[0]

  console.log(`Testing: tableId=${tableId}, slotId=${slotId}, date=${date}`)

  // Simulate two simultaneous lock requests (using Promise.all for true concurrency)
  console.log('\n⚡ Firing 2 simultaneous lock requests...')

  const [result1, result2] = await Promise.all([
    fetch(`${BASE_URL}/api/slots/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, slotId, date }),
    }).then((r) => r.json()),
    fetch(`${BASE_URL}/api/slots/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, slotId, date }),
    }).then((r) => r.json()),
  ])

  console.log('Result 1:', result1)
  console.log('Result 2:', result2)

  const heldCount = [result1, result2].filter((r) => r.held === true).length

  if (heldCount === 1) {
    console.log('\n✅ PASS: Exactly 1 lock acquired. Race condition handled correctly!')
  } else if (heldCount === 0) {
    console.log('\n⚠️  Both rejected — slot may already be locked. Clear Redis and retry.')
  } else {
    console.log('\n❌ FAIL: Both requests got { held: true }. Double-booking vulnerability detected!')
    process.exit(1)
  }
}

main().catch(console.error)
