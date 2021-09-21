import { NavBar as DesignNavBar } from '@jonasb/datadata-design';
import Link from 'next/link';

export function NavBar({ current }: { current: 'home' | 'entities' | 'graphiql' | 'voyager' }) {
  return (
    <DesignNavBar>
      <DesignNavBar.Brand>
        <DesignNavBar.Item active={current === 'home'}>
          {NavItemRender('next-web', '/')}
        </DesignNavBar.Item>
      </DesignNavBar.Brand>
      <DesignNavBar.Item active={current === 'entities'}>
        {NavItemRender('Entities', '/entities')}
      </DesignNavBar.Item>
      <DesignNavBar.Item active={current === 'graphiql'}>
        {NavItemRender('GraphiQL', '/graphiql')}
      </DesignNavBar.Item>
      <DesignNavBar.Item active={current === 'voyager'}>
        {NavItemRender('Voyager', '/voyager')}
      </DesignNavBar.Item>
    </DesignNavBar>
  );
}

function NavItemRender(text: string, href: string) {
  const renderer = ({ className }: { className: string }) => {
    return (
      <Link href={href}>
        <a className={className}>{text}</a>
      </Link>
    );
  };
  return renderer;
}
