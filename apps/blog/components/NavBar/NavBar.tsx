'use client';

import { Navbar as DesignNavbar } from '@jonasb/datadata-design';
import Link from 'next/link';
import { useState } from 'react';
import { urls } from '../../utils/PageUtils';

export function NavBar({
  current,
}: {
  current:
    | 'home'
    | 'docs'
    | 'admin-entities'
    | 'published-entities'
    | 'schema'
    | 'graphiql'
    | 'voyager';
}) {
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {NavItemRender('blog', urls.home)}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Item active={current === 'docs'}>
          {NavItemRender('Docs', urls.docs)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'admin-entities'}>
          {NavItemRender('Admin entities', urls.adminEntities)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'published-entities'}>
          {NavItemRender('Published entities', urls.publishedEntities)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'schema'}>
          {NavItemRender('Schema', urls.schemaEditor)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'graphiql'}>
          {NavItemRender('GraphiQL', urls.graphiql)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'voyager'}>
          {NavItemRender('Voyager', urls.voyager)}
        </DesignNavbar.Item>
      </DesignNavbar.Menu>
    </DesignNavbar>
  );
}

function NavItemRender(text: string, href: string) {
  const renderer = ({ className }: { className: string }) => {
    return (
      <Link className={className} href={href}>
        {text}
      </Link>
    );
  };
  return renderer;
}
