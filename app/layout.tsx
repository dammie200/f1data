import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'F1 Data Lab',
  description: 'In-depth Formula 1 analytics powered by Ergast and SQLite caching.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</main>
      </body>
    </html>
  );
}
