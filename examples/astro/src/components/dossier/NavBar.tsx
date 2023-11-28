import { Navbar as DesignNavbar } from '@dossierhq/design';
import { useState } from 'react';

interface Props {
  current: 'home' | 'content' | 'published-content' | 'schema' | 'changelog';
}

export function NavBar({ current }: Props) {
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {NavItemRender('Home', '/dossier/')}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Item active={current === 'content'}>
          {NavItemRender('Content', '/dossier/content/')}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'published-content'}>
          {NavItemRender('Published content', '/dossier/published-content/')}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'schema'}>
          {NavItemRender('Schema', '/dossier/schema')}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'changelog'}>
          {NavItemRender('Changelog', '/dossier/changelog')}
        </DesignNavbar.Item>
      </DesignNavbar.Menu>
    </DesignNavbar>
  );
}

function NavItemRender(text: string, href: string) {
  const renderer = ({ className }: { className: string }) => {
    return (
      <a className={className} href={href}>
        {text}
      </a>
    );
  };
  return renderer;
}
