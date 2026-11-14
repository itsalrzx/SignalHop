import 'reflect-metadata';
import { ConsoleLogger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { dataSource } from './database/data-source';
import { CLICKS_QUEUE, ClickPayload, redisConnection } from './analytics/queue';
import { processClick } from './analytics/process-click';
async function main() {
  const logger = new ConsoleLogger('Worker', { json: true });
  await dataSource.initialize();
  const worker = new Worker<ClickPayload>(
    CLICKS_QUEUE,
    (job) => processClick(dataSource, job.data),
    { connection: redisConnection(true), concurrency: 5 },
  );
  worker.on('failed', (job, error) =>
    logger.error({
      event: 'click_job_failed',
      jobId: job?.id,
      attempts: job?.attemptsMade,
      errorType: error.name,
    }),
  );
  worker.on('error', (error) =>
    logger.error({ event: 'worker_connection_error', errorType: error.name }),
  );
  await worker.waitUntilReady();
  logger.log({ event: 'analytics_worker_ready' });
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await worker.close();
    await dataSource.destroy();
  };
  process.once('SIGTERM', () => void stop());
  process.once('SIGINT', () => void stop());
}
void main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'worker_start_failed',
      errorType: error instanceof Error ? error.name : 'Unknown',
    }),
  );
  process.exitCode = 1;
});
