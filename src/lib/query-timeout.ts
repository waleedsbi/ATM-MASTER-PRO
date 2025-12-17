/**
 * Utility function to add timeout to database queries
 * Helps prevent long-running queries from blocking the server
 */

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000, // 10 seconds default
  errorMessage: string = 'Query timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

