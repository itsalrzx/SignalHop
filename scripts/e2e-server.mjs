import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    'postgresql://signalhop:signalhop_dev@127.0.0.1:55432/signalhop_phase0_test',
  REDIS_URL: process.env.TEST_REDIS_URL || 'redis://127.0.0.1:56379/2',
  APP_ORIGIN: 'http://localhost:3100',
  PUBLIC_BASE_URL: 'http://localhost:3100',
  API_PORT: '4100',
  API_INTERNAL_URL: 'http://127.0.0.1:4100',
  JWT_SECRET: 'e2e-only-access-secret-01234567890123456789',
};
if (!new URL(env.DATABASE_URL).pathname.endsWith('_test'))
  throw new Error('E2E requires a test database');
if (Number(new URL(env.REDIS_URL).pathname.slice(1)) < 1)
  throw new Error('E2E requires an isolated Redis database');
const migrated = spawnSync('npm', ['run', 'db:migrate'], { env, stdio: 'inherit' });
if (migrated.status !== 0) process.exit(migrated.status || 1);
const children = [
  spawn(process.execPath, ['-r', 'ts-node/register', 'apps/api/src/main.ts'], {
    env: { ...env, TS_NODE_PROJECT: resolve('apps/api/tsconfig.json') },
    stdio: 'inherit',
  }),
  spawn(
    process.execPath,
    [
      resolve('node_modules/next/dist/bin/next'),
      'dev',
      '--hostname',
      '127.0.0.1',
      '--port',
      '3100',
    ],
    {
      cwd: 'apps/web',
      env,
      stdio: 'inherit',
    },
  ),
];
const stop = () => children.forEach((child) => child.kill('SIGTERM'));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
for (const child of children)
  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
      stop();
    }
  });
