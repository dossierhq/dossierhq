import { NavBar as DesignNavBar } from '@jonasb/datadata-design';
import { Link } from 'react-router-dom';
import { ROUTE } from '../utils/RouteUtils';

interface Props {
  current: 'home' | 'admin-entities' | 'published-entities';
}

export function NavBar({ current }: Props) {
  return (
    <DesignNavBar>
      <DesignNavBar.Brand>
        <DesignNavBar.Item active={current === 'home'}>
          {NavItemRender('Playground', ROUTE.index.url)}
        </DesignNavBar.Item>
      </DesignNavBar.Brand>
      <DesignNavBar.Item active={current === 'admin-entities'}>
        {NavItemRender('Admin entities', ROUTE.adminEntities.url)}
      </DesignNavBar.Item>
      <DesignNavBar.Item active={current === 'published-entities'}>
        {NavItemRender('Published entities', ROUTE.publishedEntities.url)}
      </DesignNavBar.Item>
    </DesignNavBar>
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
