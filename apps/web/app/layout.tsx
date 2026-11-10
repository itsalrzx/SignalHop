import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'SignalHop — project foundation',
  description: 'SignalHop Phase 0 infrastructure and development foundation.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
