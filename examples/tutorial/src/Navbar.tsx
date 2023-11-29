import { Navbar as DesignNavbar } from '@dossierhq/design';
import { useCallback, useContext, useState, type MouseEvent, type MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { LogInOutButton } from './LogInOutButton.js';
import { ScreenChangesContext } from './ScreenChangesContext.js';
import { useBeforeUnload } from './useBeforeUnload.js';

interface Props {
  current: 'home' | 'content' | 'published-content' | 'schema' | 'changelog';
}

export function Navbar({ current }: Props) {
  const [active, setActive] = useState(false);
  const screenChangesMessage = useContext(ScreenChangesContext);

  const handleLinkClick = useCallback(
    (event: MouseEvent) => {
      if (screenChangesMessage && !window.confirm(screenChangesMessage)) {
        event.preventDefault();
      }
    },
    [screenChangesMessage]
  );

  useBeforeUnload(screenChangesMessage);

  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {NavItemRender('Home', '/', handleLinkClick)}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Start>
          <DesignNavbar.Item active={current === 'content'}>
            {NavItemRender('Content', '/content', handleLinkClick)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'published-content'}>
            {NavItemRender('Published content', '/published-content', handleLinkClick)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'schema'}>
            {NavItemRender('Schema', '/schema', handleLinkClick)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'changelog'}>
            {NavItemRender('Changelog', '/changelog', handleLinkClick)}
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
