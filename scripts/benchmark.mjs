const target = process.env.BENCHMARK_URL;
if (!target) throw new Error('Set BENCHMARK_URL to a locally owned /r/:code URL');
const url = new URL(target);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
  throw new Error('Benchmark is restricted to local URLs');
const samples = Number(process.env.BENCHMARK_SAMPLES || 100);
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY || 5);
if (
  !Number.isInteger(samples) ||
  samples < 1 ||
  samples > 500 ||
  !Number.isInteger(concurrency) ||
  concurrency < 1 ||
  concurrency > 20
)
  throw new Error('samples=1..500, concurrency=1..20');
const times = [];
let errors = 0;
let next = 0;
const started = performance.now();
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next++ < samples) {
      const begin = performance.now();
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
      times.push(performance.now() - begin);
      if (response.status !== 302) errors++;
      await response.arrayBuffer();
    }
  }),
);
times.sort((a, b) => a - b);
const percentile = (p) =>
  Number(times[Math.min(times.length - 1, Math.ceil(times.length * p) - 1)].toFixed(2));
console.log(
  JSON.stringify(
    {
      samples,
      concurrency,
      errors,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
      elapsedMs: Math.round(performance.now() - started),
      note: 'Local observation, includes HTTP/limiting/queue overhead; not a capacity claim.',
    },
    null,
    2,
  ),
);
