import { useCallback, useContext, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogInOutButton } from './LogInOutButton.js';
import { ScreenChangesContext } from './ScreenChangesContext.js';
import { useBeforeUnload } from './useBeforeUnload.js';

interface Props {
  current: 'home' | 'content' | 'published-content' | 'schema' | 'changelog';
}

export function Navbar({ current }: Props) {
  const screenChangesMessage = useContext(ScreenChangesContext);

  // Screens own unsaved state, so confirm before navigating away from them.
  const handleLinkClick = useCallback(
    (event: MouseEvent) => {
      if (screenChangesMessage && !window.confirm(screenChangesMessage)) {
        event.preventDefault();
      }
    },
    [screenChangesMessage],
  );

  useBeforeUnload(screenChangesMessage);

  return (
    <nav className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5">
      <NavLink active={current === 'home'} to="/" onClick={handleLinkClick}>
        Home
      </NavLink>
      <NavLink active={current === 'content'} to="/content" onClick={handleLinkClick}>
        Content
      </NavLink>
      <NavLink
        active={current === 'published-content'}
        to="/published-content"
        onClick={handleLinkClick}
      >
        Published content
      </NavLink>
      <NavLink active={current === 'schema'} to="/schema" onClick={handleLinkClick}>
        Schema
      </NavLink>
      <NavLink active={current === 'changelog'} to="/changelog" onClick={handleLinkClick}>
        Changelog
      </NavLink>
      <div className="ml-auto">
        <LogInOutButton />
      </div>
    </nav>
  );
}

function NavLink({
  active,
  to,
  onClick,
  children,
}: {
  active: boolean;
  to: string;
  onClick: (event: MouseEvent) => void;
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
      to={to}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
