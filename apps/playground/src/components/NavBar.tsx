import { Navbar as DesignNavbar } from '@dossierhq/design';
import type { ReactNode } from 'react';
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext.js';
import { ROUTE } from '../utils/RouteUtils.js';
import logo from './logo.svg';

interface Props {
  current: 'home' | 'admin-entities' | 'published-entities' | 'schema' | 'graphiql';
}

export function NavBar({ current }: Props) {
  const { currentUserId, users } = useContext(UserContext);
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {({ className }) => (
            <Link to={ROUTE.index.url}>
              <img className={className} src={logo} alt="Dossier logo" width={270} height={28} />
            </Link>
          )}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Start>
          <DesignNavbar.Item active={current === 'admin-entities'}>
            {NavItemRender('Entities', ROUTE.adminEntities.url)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'published-entities'}>
            {NavItemRender('Published entities', ROUTE.publishedEntities.url)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'schema'}>
            {NavItemRender('Schema', ROUTE.schema.url)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'graphiql'}>
            {NavItemRender('GraphiQL', ROUTE.graphiql.url)}
          </DesignNavbar.Item>
        </DesignNavbar.Start>
        <DesignNavbar.End>
          <DesignNavbar.Dropdown left renderLink={(className) => <a className={className}>User</a>}>
            {users.map((user) => (
              <NavigationItem
                key={user.id}
                active={user.id === currentUserId}
                to={ROUTE.login.url(user.id)}
              >
                {user.name}
              </NavigationItem>
            ))}
          </DesignNavbar.Dropdown>
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
