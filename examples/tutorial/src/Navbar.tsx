import { Navbar as DesignNavbar } from '@dossierhq/design';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogInOutButton } from './LogInOutButton.js';

interface Props {
  current: 'home' | 'admin-entities' | 'published-entities' | 'schema';
}

export function Navbar({ current }: Props) {
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {NavItemRender('Home', '/')}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Start>
          <DesignNavbar.Item active={current === 'admin-entities'}>
            {NavItemRender('Entities', '/admin-entities')}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'published-entities'}>
            {NavItemRender('Published entities', '/published-entities')}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'schema'}>
            {NavItemRender('Schema', '/schema')}
          </DesignNavbar.Item>
        </DesignNavbar.Start>
        <DesignNavbar.End>
          <DesignNavbar.Item>
            {({ className }) => (
              <div className={className}>
                <LogInOutButton />
              </div>
            )}
          </DesignNavbar.Item>
        </DesignNavbar.End>
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
