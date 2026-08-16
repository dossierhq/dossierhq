import type { ReactNode } from 'react';

interface Props {
  current: 'home' | 'content' | 'published-content' | 'schema' | 'changelog';
}

export function NavBar({ current }: Props) {
  return (
    <nav className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5">
      <NavLink active={current === 'home'} href="/dossier/">
        Home
      </NavLink>
      <NavLink active={current === 'content'} href="/dossier/content/">
        Content
      </NavLink>
      <NavLink active={current === 'published-content'} href="/dossier/published-content/">
        Published content
      </NavLink>
      <NavLink active={current === 'schema'} href="/dossier/schema">
        Schema
      </NavLink>
      <NavLink active={current === 'changelog'} href="/dossier/changelog">
        Changelog
      </NavLink>
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
    <a
      className={
        active
          ? 'bg-accent text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors'
          : 'text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors'
      }
      aria-current={active ? 'page' : undefined}
      href={href}
    >
      {children}
    </a>
  );
}
