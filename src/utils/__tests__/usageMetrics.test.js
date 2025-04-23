import { calculateUsageMetrics } from '../usageMetrics';

describe('calculateUsageMetrics', () => {
  it('returns null if stats or limits are missing', () => {
    expect(calculateUsageMetrics(null, {})).toBeNull();
    expect(calculateUsageMetrics({}, null)).toBeNull();
  });

  it('calculates correct percentages and status classes', () => {
    const stats = {
      minute: { requests: 45 },
      daily: { tokens: 900 }
    };
    const limits = {
      requestsPerMinute: 100,
      tokensPerDay: 1000
    };
    const metrics = calculateUsageMetrics(stats, limits);
    expect(metrics.minuteRequestsPercent).toBe(45);
    expect(metrics.dailyTokensPercent).toBe(90);
    expect(metrics.requestsClass).toBe('usage-green');
    expect(metrics.tokensClass).toBe('usage-red');
    expect(metrics.stats).toBe(stats);
    expect(metrics.limits).toBe(limits);
  });

  it('caps percentages at 100', () => {
    const stats = {
      minute: { requests: 200 },
      daily: { tokens: 2000 }
    };
    const limits = {
      requestsPerMinute: 100,
      tokensPerDay: 1000
    };
    const metrics = calculateUsageMetrics(stats, limits);
    expect(metrics.minuteRequestsPercent).toBe(100);
    expect(metrics.dailyTokensPercent).toBe(100);
  });
});
