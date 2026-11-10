import 'reflect-metadata';
import { createApp } from './bootstrap';
import { settings } from './config/config';
async function main() {
  const app = await createApp();
  await app.listen(settings().port, '0.0.0.0');
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Startup failed');
  process.exitCode = 1;
});
