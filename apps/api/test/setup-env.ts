process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://signalhop:signalhop_dev@127.0.0.1:55432/signalhop_phase0_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:56379/1';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-only-access-secret-01234567890123456789';
process.env.FINGERPRINT_SECRET = 'test-only-fingerprint-secret-012345678901234';
process.env.NODE_ENV = 'test';
if (!new URL(process.env.DATABASE_URL).pathname.endsWith('_test'))
  throw new Error('Tests require a database ending in _test');
if (Number(new URL(process.env.REDIS_URL).pathname.slice(1)) < 1)
  throw new Error('Tests require a separate Redis logical database');
