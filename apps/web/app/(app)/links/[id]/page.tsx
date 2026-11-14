import { AnalyticsDashboard } from '@/components/analytics-dashboard';
export default async function LinkAnalytics({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalyticsDashboard linkId={id} />;
}
