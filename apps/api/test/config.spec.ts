import { settings } from '../src/config/config';
const env = {
  DATABASE_URL: 'postgresql://user:pass@localhost/foundation',
  REDIS_URL: 'redis://localhost:6379',
  APP_ORIGIN: 'http://localhost:3000',
};
describe('foundation configuration', () => {
  it('rejects missing database configuration', () =>
    expect(() => settings({ ...env, DATABASE_URL: '' })).toThrow('DATABASE_URL'));
  it('rejects a non-PostgreSQL database', () =>
    expect(() => settings({ ...env, DATABASE_URL: 'mysql://user:pass@localhost/db' })).toThrow(
      'PostgreSQL',
    ));
  it('requires database credentials through configuration', () =>
    expect(() => settings({ ...env, DATABASE_URL: 'postgresql://localhost/db' })).toThrow(
      'credentials',
    ));
  it('rejects an invalid Redis protocol', () =>
    expect(() => settings({ ...env, REDIS_URL: 'http://localhost:6379' })).toThrow('Redis'));
  it('rejects production HTTP origins', () =>
    expect(() => settings({ ...env, NODE_ENV: 'production' })).toThrow('HTTPS'));
  it('rejects an invalid port', () =>
    expect(() => settings({ ...env, API_PORT: 'NaN' })).toThrow('API_PORT'));
});
