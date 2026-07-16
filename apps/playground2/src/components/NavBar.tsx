import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/ClassUtils';
import { UserIcon } from 'lucide-react';
import { useCallback, useContext, type MouseEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ScreenChangesContext } from '../contexts/ScreenChangesContext.js';
import { UserContext } from '../contexts/UserContext.js';
import { useBeforeUnload } from '../hooks/useBeforeUnload.js';
import { ROUTE } from '../utils/RouteUtils.js';
import logo from './logo.svg';

type NavBarPage = 'home' | 'content' | 'published-content' | 'schema' | 'changelog';

export function NavBar({ current }: { current: NavBarPage }) {
  const { currentUserId, users } = useContext(UserContext);
  const screenChangesMessage = useContext(ScreenChangesContext);
  const { serverName } = useParams<{ serverName: string }>();

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

  const currentUser = users.find((it) => it.id === currentUserId);

  return (
    <nav className="flex shrink-0 items-center gap-1 border-b px-2 py-1.5">
      <Link
        className="mr-2 flex items-center"
        to={serverName ? ROUTE.server.url(serverName) : ROUTE.index.url}
        onClick={handleLinkClick}
      >
        <img src={logo} alt="Dossier logo" width={102} height={27} />
      </Link>
      {serverName ? (
        <>
          <NavLink
            active={current === 'content'}
            to={ROUTE.contentList.url(serverName)}
            onClick={handleLinkClick}
          >
            Content
          </NavLink>
          <NavLink
            active={current === 'published-content'}
            to={ROUTE.publishedContentList.url(serverName)}
            onClick={handleLinkClick}
          >
            Published content
          </NavLink>
          <NavLink
            active={current === 'schema'}
            to={ROUTE.schemaEditor.url(serverName)}
            onClick={handleLinkClick}
          >
            Schema
          </NavLink>
          <NavLink
            active={current === 'changelog'}
            to={ROUTE.changelog.url(serverName)}
            onClick={handleLinkClick}
          >
            Changelog
          </NavLink>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="ml-auto" variant="ghost" size="sm">
                <UserIcon className="size-4" />
                {currentUser?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {users.map((user) => (
                <DropdownMenuItem key={user.id} asChild>
                  <Link to={ROUTE.login.url(serverName, user.id)} onClick={handleLinkClick}>
                    <span className={cn(user.id === currentUserId && 'font-semibold')}>
                      {user.name}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <a
          className="text-muted-foreground hover:text-foreground ml-auto px-3 py-1.5 text-sm"
          href="https://dossierhq.dev/docs"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
      )}
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
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
      aria-current={active ? 'page' : undefined}
      to={to}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
