import { Navbar as DesignNavbar, Icon } from '@dossierhq/design';
import {
  useCallback,
  useContext,
  useState,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { ScreenChangesContext } from '../contexts/ScreenChangesContext.js';
import { UserContext } from '../contexts/UserContext.js';
import { useBeforeUnload } from '../hooks/useBeforeUnload.js';
import { ROUTE } from '../utils/RouteUtils.js';
import logo from './logo.svg';

interface Props {
  current: 'home' | 'content' | 'published-content' | 'schema' | 'changelog' | 'graphiql';
}

export function NavBar({ current }: Props) {
  const { currentUserId, users } = useContext(UserContext);
  const screenChangesMessage = useContext(ScreenChangesContext);
  const [active, setActive] = useState(false);
  const { serverName } = useParams();

  const handleLinkClick = useCallback(
    (event: MouseEvent) => {
      if (screenChangesMessage && !window.confirm(screenChangesMessage)) {
        event.preventDefault();
      }
    },
    [screenChangesMessage]
  );

  useBeforeUnload(screenChangesMessage);

  const currentUser = users.find((it) => it.id === currentUserId);

  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {({ className }) => (
            <Link
              to={serverName ? ROUTE.server.url(serverName) : ROUTE.index.url}
              onClick={handleLinkClick}
            >
              <img className={className} src={logo} alt="Dossier logo" width={136} height={36} />
            </Link>
          )}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Start>
          {serverName ? (
            <>
              <DesignNavbar.Item active={current === 'content'}>
                {NavItemRender('Content', ROUTE.content.url(serverName), handleLinkClick)}
              </DesignNavbar.Item>
              <DesignNavbar.Item active={current === 'published-content'}>
                {NavItemRender(
                  'Published content',
                  ROUTE.publishedContent.url(serverName),
                  handleLinkClick
                )}
              </DesignNavbar.Item>
              <DesignNavbar.Item active={current === 'schema'}>
                {NavItemRender('Schema', ROUTE.schema.url(serverName), handleLinkClick)}
              </DesignNavbar.Item>
              <DesignNavbar.Item active={current === 'changelog'}>
                {NavItemRender('Changelog', ROUTE.changelog.url(serverName), handleLinkClick)}
              </DesignNavbar.Item>
              <DesignNavbar.Item active={current === 'graphiql'}>
                {NavItemRender('GraphiQL', ROUTE.graphiql.url(serverName), handleLinkClick)}
              </DesignNavbar.Item>
            </>
          ) : (
            <DesignNavbar.Item>
              {({ className }) => (
                <a
                  className={className}
                  href="https://dossierhq.dev/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Docs{' '}
                  <Icon icon="openInNewWindow" text size="small" style={{ marginLeft: '0.5em' }} />
                </a>
              )}
            </DesignNavbar.Item>
          )}
        </DesignNavbar.Start>
        <DesignNavbar.End>
          {serverName ? (
            <DesignNavbar.Dropdown
              left
              renderLink={(className) => (
                <a className={className}>
                  <Icon text icon="user" style={{ marginRight: '0.25em' }} /> {currentUser?.name}
                </a>
              )}
            >
              {users.map((user) => (
                <NavigationItem
                  key={user.id}
                  active={user.id === currentUserId}
                  to={ROUTE.login.url(serverName, user.id)}
                  onClick={handleLinkClick}
                >
                  {user.name}
                </NavigationItem>
              ))}
            </DesignNavbar.Dropdown>
          ) : null}
        </DesignNavbar.End>
      </DesignNavbar.Menu>
    </DesignNavbar>
  );
}

function NavigationItem({
  active,
  to,
  onClick,
  children,
}: {
  active?: boolean;
  to: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
}) {
  return (
    <DesignNavbar.Item active={active}>
      {({ className }: { className: string }) => (
        <Link to={to} className={className} onClick={onClick}>
          {children}
        </Link>
      )}
    </DesignNavbar.Item>
  );
}

function NavItemRender(text: string, to: string, onClick: MouseEventHandler<HTMLAnchorElement>) {
  const renderer = ({ className }: { className: string }) => {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {text}
      </Link>
    );
  };
  return renderer;
}
