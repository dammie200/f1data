'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Home' },
  { href: '/seasons/2024', label: 'Seasons' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/constructors', label: 'Constructors' },
  { href: '/circuits', label: 'Circuits' }
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200">
        <Link href="/" className="text-lg font-black text-white">F1 Data Lab</Link>
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'rounded px-3 py-1 transition-colors hover:bg-slate-800',
                pathname.startsWith(link.href) && 'bg-slate-800 text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
