'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Globe,
  Link2,
  MousePointer2,
  Monitor,
  RefreshCw,
  Users,
  BarChart3,
} from 'lucide-react';
import { api, type AnalyticsReport } from '@/lib/api';
import { QRDialog } from './qr-dialog';
import { LinkDialog } from './link-dialog';
import { LinksTable } from './links-table';
import { Button } from './ui/button';
const number = (n: number) => new Intl.NumberFormat().format(n);
const dateLabel = (date: string) =>
  new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
function Stat({
  label,
  value,
  note,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof Link2;
  color: string;
}) {
  return (
    <div className="card stat-card" role="group" aria-label={label}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#7f8d82]">{label}</span>
        <span className={'stat-icon ' + color}>
          <Icon size={16} />
        </span>
      </div>
      <p className="stat-number">{number(value)}</p>
      <p className="mt-2 text-[10px] text-[#68796b]">{note}</p>
    </div>
  );
}
function Breakdown({
  title,
  items,
  total,
  icon: Icon,
}: {
  title: string;
  items: { name: string; value: number }[];
  total: number;
  icon: typeof Globe;
}) {
  return (
    <section className="card flex h-full flex-col p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <Icon size={15} className="text-[#9ca99e]" />
      </div>
      {items.length ? (
        <div className="space-y-4">
          {items.slice(0, 5).map((item, i) => (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={'source-dot source-' + i}>
                    {item.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate text-[#6a7b6e]">{item.name}</span>
                </span>
                <span className="tabular-nums text-[#66796a]">{number(item.value)}</span>
              </div>
              <div className="ml-8 h-[3px] rounded-full bg-[#f0f4ef]">
                <div
                  className="h-full rounded-full bg-[#87b798]"
                  style={{ width: Math.min(100, (item.value / Math.max(1, total)) * 100) + '%' }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <Icon size={25} className="mb-3 text-[#c7d5c9]" />
          <p className="text-xs text-[#87968a]">A little quiet here, for now.</p>
          <p className="mt-2 max-w-[170px] text-[10px] leading-5 text-[#718174]">
            Your first visits will bring this to life.
          </p>
        </div>
      )}
    </section>
  );
}
export function AnalyticsDashboard({ full = false, linkId }: { full?: boolean; linkId?: string }) {
  const [days, setDays] = useState(7);
  const query = useQuery({
    queryKey: ['analytics', linkId || 'overview', days],
    queryFn: () =>
      api<AnalyticsReport>(
        (linkId ? '/links/' + linkId + '/analytics' : '/analytics/overview') + '?days=' + days,
      ),
    refetchInterval: 5000,
  });
  const report = query.data;
  const title = linkId ? report?.link?.title || 'Link analytics' : full ? 'Analytics' : 'Overview';
  return (
    <>
      {linkId && (
        <Link
          href="/links"
          className="mb-5 inline-flex items-center gap-2 text-xs text-[#849287] hover:text-[#13795b]"
        >
          <ArrowLeft size={13} />
          Back to my links
        </Link>
      )}
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">
            {linkId ? 'A CLOSER LOOK' : full ? 'THE BIGGER PICTURE' : 'YOUR LINKS AT A GLANCE'}
          </p>
          <h1>
            {title}
            <span className="text-[#31916a]">.</span>
          </h1>
          <p>
            {linkId
              ? report?.link?.shortUrl || 'Loading your link…'
              : full
                ? 'Understand the connections behind every click.'
                : 'Every link has a story. Here’s yours.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {linkId && report?.link ? (
            <>
              <QRDialog link={report.link} />
              <LinkDialog link={report.link} />
            </>
          ) : (
            !full && <LinkDialog />
          )}
          <label className="range-select">
            <CalendarDays size={14} />
            <select
              aria-label="Analytics period"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
        </div>
      </div>
      {query.error ? (
        <div role="alert" className="error-banner">
          {query.error.message}
          <button className="ml-3 underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : !report ? (
        <div className="stats-grid">
          {[0, 1, 2].map((n) => (
            <div key={n} className="card h-36 animate-pulse bg-[#f1f5ef]" />
          ))}
          <p className="sr-only">Loading analytics</p>
        </div>
      ) : (
        <>
          <div className={'stats-grid ' + (linkId ? 'stats-two' : '')}>
            {!linkId && (
              <Stat
                label="Total links"
                value={report.summary.totalLinks}
                note={number(report.summary.activeLinks) + ' active in your collection'}
                icon={Link2}
                color="stat-green"
              />
            )}
            <Stat
              label="Total clicks"
              value={report.summary.totalClicks}
              note={'Captured redirects · last ' + days + ' days'}
              icon={MousePointer2}
              color="stat-orange"
            />
            <Stat
              label="Estimated visitors"
              value={report.summary.uniqueVisitors}
              note="A useful estimate, not a count of people"
              icon={Users}
              color="stat-purple"
            />
          </div>
          <div className={full || linkId ? '' : 'analytics-grid'}>
            <section className="card chart-card">
              <div className="mb-1 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[13px] font-semibold">Click activity</h2>
                  <p className="mt-2 text-[10px] text-[#68796b]">
                    A day-by-day view of your connections
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Refresh analytics"
                  onClick={() => void query.refetch()}
                >
                  <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : ''} />
                </Button>
              </div>
              <div
                className="chart-container"
                role="img"
                aria-label={
                  number(report.summary.totalClicks) +
                  ' captured clicks over ' +
                  days +
                  ' UTC dates'
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={report.daily}
                    margin={{ top: 28, right: 12, left: -25, bottom: 0 }}
                    accessibilityLayer
                  >
                    <defs>
                      <linearGradient
                        id={'clickGradient-' + (linkId || 'all')}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#6fa784" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#6fa784" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eaf0e8" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={dateLabel}
                      tick={{ fontSize: 10, fill: '#68796b' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                      dy={10}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, (max: number) => Math.max(4, max)]}
                      tick={{ fontSize: 10, fill: '#68796b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      labelFormatter={(label) => dateLabel(String(label))}
                      formatter={(value) => [value, 'Clicks']}
                      contentStyle={{
                        border: '1px solid #e0e9df',
                        borderRadius: 10,
                        fontSize: 12,
                        boxShadow: '0 5px 20px #29402c0d',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#54966d"
                      strokeWidth={2.2}
                      fill={'url(#clickGradient-' + (linkId || 'all') + ')'}
                      activeDot={{ r: 4, strokeWidth: 3, stroke: 'white' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between border-t border-[#f1f4ee] pt-4 text-[10px] text-[#68796b]">
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#6a9f7c]" />
                  Tracked clicks
                </span>
                <span>
                  Dates shown in UTC · Updated{' '}
                  <time dateTime={report.generatedAt}>
                    {new Date(report.generatedAt).toISOString().slice(11, 19)} UTC
                  </time>
                </span>
              </div>
              <table className="sr-only">
                <caption>Daily clicks in UTC</caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{d.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            {!full && !linkId && (
              <Breakdown
                title="Top referrers"
                items={report.referrers}
                total={report.summary.totalClicks}
                icon={Globe}
              />
            )}
          </div>
          {full || linkId ? (
            <>
              <div className="breakdowns-grid">
                <Breakdown
                  title="Top referrers"
                  items={report.referrers}
                  total={report.summary.totalClicks}
                  icon={Globe}
                />
                <Breakdown
                  title="Devices"
                  items={report.devices}
                  total={report.summary.totalClicks}
                  icon={Monitor}
                />
                <Breakdown
                  title="Browsers"
                  items={report.browsers}
                  total={report.summary.totalClicks}
                  icon={Globe}
                />
              </div>
              {!linkId && (
                <section className="card mt-5 p-5">
                  <h2 className="mb-5 text-[13px] font-semibold">Most popular links</h2>
                  {report.topLinks.length ? (
                    report.topLinks.map((link, i) => (
                      <Link
                        key={link.id}
                        href={'/links/' + link.id}
                        className="flex items-center gap-4 border-t border-[#f0f3ee] py-4 text-xs first:border-0"
                      >
                        <span className="text-[#718174]">0{i + 1}</span>
                        <span className="flex-1 font-medium text-[#5c7160]">
                          {link.title || new URL(link.destination).hostname}
                        </span>
                        <span className="text-[#7e9182]">{number(link.clicks)} clicks</span>
                        <ArrowUpRight size={14} className="text-[#97a69b]" />
                      </Link>
                    ))
                  ) : (
                    <p className="py-8 text-center text-xs text-[#68796b]">
                      Share a link to start seeing what resonates.
                    </p>
                  )}
                </section>
              )}
            </>
          ) : (
            <>
              <div className="section-heading">
                <h2>
                  Recent links{' '}
                  <span className="ml-2 rounded bg-[#edf2e9] px-1.5 py-0.5 text-[10px] font-normal text-[#809278]">
                    {number(report.summary.totalLinks)}
                  </span>
                </h2>
                <Link
                  href="/links"
                  className="inline-flex items-center gap-1.5 text-[11px] text-[#7e9182] hover:text-[#13795b]"
                >
                  View all links
                  <ArrowRight size={13} />
                </Link>
              </div>
              <LinksTable compact />
            </>
          )}
          <p className="mt-5 flex items-center gap-1.5 text-[10px] leading-5 text-[#68796b]">
            <BarChart3 size={12} />
            Clicks update asynchronously. Visitor counts are estimates; bots and previews may be
            included.
          </p>
        </>
      )}
    </>
  );
}
