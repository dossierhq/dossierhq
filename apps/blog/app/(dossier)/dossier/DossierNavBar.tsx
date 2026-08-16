'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrowserUrls } from '../../../utils/BrowserUrls';

type DossierNavBarPage = 'content' | 'published-content' | 'schema' | 'changelog';

export function DossierNavBar({ current }: { current: DossierNavBarPage }) {
  return (
    <nav className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5">
      <NavLink active={current === 'content'} href={BrowserUrls.content}>
        Content
      </NavLink>
      <NavLink active={current === 'published-content'} href={BrowserUrls.publishedContent}>
        Published content
      </NavLink>
      <NavLink active={current === 'schema'} href={BrowserUrls.schemaEditor}>
        Schema
      </NavLink>
      <NavLink active={current === 'changelog'} href={BrowserUrls.changelog}>
        Changelog
      </NavLink>
      <Link
        className="text-muted-foreground hover:text-foreground ml-auto px-3 py-1.5 text-sm"
        href={BrowserUrls.home}
      >
        Back to site
      </Link>
    </nav>
  );
}

function NavLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={
        active
          ? 'bg-accent text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors'
          : 'text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors'
      }
      aria-current={active ? 'page' : undefined}
      href={href}
    >
      {children}
    </Link>
  );
}
