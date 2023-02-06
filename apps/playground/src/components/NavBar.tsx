import { Icon, Navbar as DesignNavbar } from '@dossierhq/design';
import type { ReactNode } from 'react';
import { useContext, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext.js';
import { ROUTE } from '../utils/RouteUtils.js';
import logo from './logo.svg';

interface Props {
  current: 'home' | 'admin-entities' | 'published-entities' | 'schema' | 'graphiql';
}

export function NavBar({ current }: Props) {
  const { currentUserId, users } = useContext(UserContext);
  const [active, setActive] = useState(false);
  const { serverName } = useParams();

  const currentUser = users.find((it) => it.id === currentUserId);

  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {({ className }) => (
            <Link to={serverName ? ROUTE.server.url(serverName) : ROUTE.index.url}>
              <img className={className} src={logo} alt="Dossier logo" width={136} />
            </Link>
          )}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Start>
          {serverName ? (
            <>
              <DesignNavbar.Item active={current === 'admin-entities'}>
                {NavItemRender('Entities', ROUTE.adminEntities.url(serverName))}
              </DesignNavbar.Item>
              <DesignNavbar.Item active={current === 'published-entities'}>
                {NavItemRender('Published entities', ROUTE.publishedEntities.url(serverName))}
              </DesignNavbar.Item>
              <DesignNavbar.Item active={current === 'schema'}>
                {NavItemRender('Schema', ROUTE.schema.url(serverName))}
              </DesignNavbar.Item>
              <DesignNavbar.Item active={current === 'graphiql'}>
                {NavItemRender('GraphiQL', ROUTE.graphiql.url(serverName))}
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
  children,
}: {
  active?: boolean;
  to: string;
  children: ReactNode;
}) {
  return (
    <DesignNavbar.Item active={active}>
      {({ className }: { className: string }) => (
        <Link to={to} className={className}>
          {children}
        </Link>
      )}
    </DesignNavbar.Item>
  );
}

function NavItemRender(text: string, to: string) {
  const renderer = ({ className }: { className: string }) => {
    return (
      <Link to={to} className={className}>
        {text}
      </Link>
    );
  };
  return renderer;
}
