import Link from 'next/link';
import type { ReactNode } from 'react';
import { ENABLE_WEB_INTERFACE } from '../../config/WebInterfaceConfig';
import { BrowserUrls } from '../../utils/BrowserUrls';

interface Props {
  current:
    | 'home'
    | 'content'
    | 'published-content'
    | 'schema'
    | 'changelog'
    | 'graphiql'
    | 'voyager';
}

export function NavBar({ current }: Props) {
  return (
    <nav className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5">
      <NavLink active={current === 'home'} href={BrowserUrls.home}>
        {process.env.NEXT_PUBLIC_SITE_NAME ?? 'Home'}
      </NavLink>
      {ENABLE_WEB_INTERFACE ? (
        <>
          <NavLink active={current === 'content'} href={BrowserUrls.contentList}>
            Content
          </NavLink>
          <NavLink active={current === 'published-content'} href={BrowserUrls.publishedContentList}>
            Published content
          </NavLink>
          <NavLink active={current === 'schema'} href={BrowserUrls.schemaEditor}>
            Schema
          </NavLink>
          <NavLink active={current === 'changelog'} href={BrowserUrls.changelogList}>
            Changelog
          </NavLink>
          <NavLink active={current === 'graphiql'} href={BrowserUrls.graphiql}>
            GraphiQL
          </NavLink>
          <NavLink active={current === 'voyager'} href={BrowserUrls.voyager}>
            Voyager
          </NavLink>
        </>
      ) : null}
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
