type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, RateLimitRecord>();

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    return {
      limited: false,
      remaining: Math.max(0, limit - 1),
      resetAt: next.resetAt
    };
  }

  current.count += 1;

  return {
    limited: current.count > limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt
  };
}

export function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>, limit: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
  };
}
