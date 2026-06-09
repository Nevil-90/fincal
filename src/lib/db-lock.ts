/**
 * In-memory Database Semaphore Lock
 * 
 * Protects the Prisma Connection Pool from P2024 Timeout Errors
 * by enforcing a strict concurrency limit across the Node.js event loop.
 */

const MAX_CONCURRENT_DB_QUERIES = 8; // Keep below Prisma's default pool limit
let activeQueries = 0;
const queryQueue: (() => void)[] = [];

async function acquireLock(): Promise<void> {
  if (activeQueries < MAX_CONCURRENT_DB_QUERIES) {
    activeQueries++;
    return;
  }
  return new Promise<void>((resolve) => {
    queryQueue.push(resolve);
  });
}

function releaseLock(): void {
  if (queryQueue.length > 0) {
    const next = queryQueue.shift();
    if (next) next();
  } else {
    activeQueries--;
  }
}

/**
 * Wraps a database operation in a concurrency lock.
 */
export async function withDbLock<T>(operation: () => Promise<T>): Promise<T> {
  await acquireLock();
  try {
    return await operation();
  } finally {
    releaseLock();
  }
}
