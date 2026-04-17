export type Tier = "free" | "pro" | "team";

const FREE_TIER_LIMIT = 5;

export interface UsageResult {
  allowed: boolean;
  remaining: number;
  total: number;
}

export class RateLimiter {
  private readonly usage = new Map<string, number>();

  checkLimit(apiKey: string, tier: Tier): UsageResult {
    if (tier === "pro" || tier === "team") {
      return { allowed: true, remaining: Infinity, total: Infinity };
    }

    const current = this.usage.get(apiKey) ?? 0;
    const remaining = Math.max(0, FREE_TIER_LIMIT - current);
    return {
      allowed: current < FREE_TIER_LIMIT,
      remaining,
      total: FREE_TIER_LIMIT,
    };
  }

  recordUsage(apiKey: string): void {
    const current = this.usage.get(apiKey) ?? 0;
    this.usage.set(apiKey, current + 1);
  }

  getUsage(apiKey: string): number {
    return this.usage.get(apiKey) ?? 0;
  }
}

export function createRateLimitMiddleware(
  rateLimiter: RateLimiter,
  apiKey: string,
  tier: Tier
) {
  return async function withRateLimit<T>(
    handler: () => Promise<T>
  ): Promise<T> {
    const check = rateLimiter.checkLimit(apiKey, tier);
    if (!check.allowed) {
      throw new Error(
        `Rate limit exceeded. Free tier allows ${FREE_TIER_LIMIT} total requests. Upgrade to Pro ($19/mo) for unlimited access.`
      );
    }
    rateLimiter.recordUsage(apiKey);
    return handler();
  };
}
