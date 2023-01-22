import { Navbar as DesignNavbar } from '@dossierhq/design';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
  current: 'home' | 'entities' | 'published-entities' | 'schema';
}

export function NavBar({ current }: Props) {
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {NavItemRender('next-web', '/')}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Item active={current === 'entities'}>
          {NavItemRender('Entities', '/entities')}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'published-entities'}>
          {NavItemRender('Published entities', '/published-entities')}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'schema'}>
          {NavItemRender('Schema', '/schema')}
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
