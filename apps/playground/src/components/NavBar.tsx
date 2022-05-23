import { Navbar as DesignNavbar } from '@jonasb/datadata-design';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTE } from '../utils/RouteUtils';

interface Props {
  current: 'home' | 'admin-entities' | 'published-entities' | 'schema';
}

export function NavBar({ current }: Props) {
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {NavItemRender('Playground', ROUTE.index.url)}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Item active={current === 'admin-entities'}>
          {NavItemRender('Admin entities', ROUTE.adminEntities.url)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'published-entities'}>
          {NavItemRender('Published entities', ROUTE.publishedEntities.url)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'schema'}>
          {NavItemRender('Schema', ROUTE.schema.url)}
        </DesignNavbar.Item>
      </DesignNavbar.Menu>
    </DesignNavbar>
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
