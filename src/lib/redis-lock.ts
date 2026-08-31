import { redis } from '@/lib/redis'

const LOCK_TTL_SECONDS = 300 // 5 minutes

function lockKey(tableId: string, slotId: string, date: string): string {
  return `lock:table_${tableId}:slot_${slotId}:date_${date}`
}

/**
 * Atomically acquire a slot lock using SET NX EX.
 * Returns true only if this userId is the first writer.
 */
export async function acquireLock(
  tableId: string,
  slotId: string,
  date: string,
  userId: string
): Promise<boolean> {
  const key = lockKey(tableId, slotId, date)
  // SET key value NX EX ttl — only sets if key does NOT exist
  const result = await redis.set(key, userId, { nx: true, ex: LOCK_TTL_SECONDS })
  return result === 'OK'
}

/**
 * Release a lock — only allowed by the user who holds it.
 */
export async function releaseLock(
  tableId: string,
  slotId: string,
  date: string,
  userId: string
): Promise<boolean> {
  const key = lockKey(tableId, slotId, date)
  const holder = await redis.get<string>(key)
  if (holder !== userId) return false // not your lock
  await redis.del(key)
  return true
}

/**
 * Get the userId currently holding this lock (or null if free).
 */
export async function getLockHolder(
  tableId: string,
  slotId: string,
  date: string
): Promise<string | null> {
  const key = lockKey(tableId, slotId, date)
  return redis.get<string>(key)
}

/**
 * Get remaining TTL in seconds for the lock.
 */
export async function getLockTTL(
  tableId: string,
  slotId: string,
  date: string
): Promise<number> {
  const key = lockKey(tableId, slotId, date)
  return redis.ttl(key)
}

/**
 * Get all active slot locks for a given date+table (for real-time grid).
 */
export async function getLockedSlots(
  tableId: string,
  date: string
): Promise<{ slotId: string; userId: string }[]> {
  const pattern = `lock:table_${tableId}:slot_*:date_${date}`
  const keys = await redis.keys(pattern)
  if (keys.length === 0) return []

  const values = await Promise.all(keys.map((k) => redis.get<string>(k)))
  return keys.map((key, i) => {
    const slotId = key.split(':slot_')[1].split(':date_')[0]
    return { slotId, userId: values[i] ?? '' }
  })
}
