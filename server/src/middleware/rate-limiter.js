/**
 * In-memory sliding-window rate limiter for sensitive authentication & public mutation endpoints.
 * Zero external dependencies, thread-safe within Node event loop.
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 20,
  message = 'Çok fazla istek yapıldı. Lütfen bir süre sonra tekrar deneyin.',
  keyGenerator = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
  },
  skip = () => process.env.NODE_ENV === 'test' && !process.env.ENFORCE_RATE_LIMIT,
} = {}) {
  const hits = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.resetTime > windowMs) {
        hits.delete(key);
      }
    }
  };

  const timer = setInterval(cleanup, windowMs);
  if (timer.unref) timer.unref();

  const middleware = (req, res, next) => {
    if (skip(req)) return next();

    const key = keyGenerator(req);
    const now = Date.now();
    let record = hits.get(key);

    if (!record || now - record.resetTime > windowMs) {
      record = { count: 1, resetTime: now };
      hits.set(key, record);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - 1));
      return next();
    }

    record.count++;
    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((windowMs - (now - record.resetTime)) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };

  middleware.reset = () => hits.clear();
  return middleware;
}
