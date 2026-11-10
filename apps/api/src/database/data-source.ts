import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { settings } from '../config/config';
import { join } from 'node:path';
export const dataSource = new DataSource({
  type: 'postgres',
  url: settings().databaseUrl,
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  installExtensions: false,
  uuidExtension: 'pgcrypto',
  logging: false,
  extra: { max: 10, statement_timeout: 5000, connectionTimeoutMillis: 3000 },
});
