import { Navbar as DesignNavbar } from '@dossierhq/design';
import Link from 'next/link';
import { useState } from 'react';
import { ENABLE_WEB_INTERFACE } from '../../config/WebInterfaceConfig';
import { BrowserUrls } from '../../utils/BrowserUrls';

interface Props {
  current:
    | 'home'
    | 'content'
    | 'published-content'
    | 'schema'
    | 'changelog'
    | 'graphiql'
    | 'voyager';
}

export function NavBar({ current }: Props) {
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {NavItemRender(process.env.NEXT_PUBLIC_SITE_NAME ?? 'Home', BrowserUrls.home)}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        {ENABLE_WEB_INTERFACE ? (
          <>
            <DesignNavbar.Item active={current === 'content'}>
              {NavItemRender('Content', BrowserUrls.contentList)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'published-content'}>
              {NavItemRender('Published content', BrowserUrls.publishedContentList)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'schema'}>
              {NavItemRender('Schema', BrowserUrls.schemaEditor)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'changelog'}>
              {NavItemRender('Changelog', BrowserUrls.changelogList)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'graphiql'}>
              {NavItemRender('GraphiQL', BrowserUrls.graphiql)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'voyager'}>
              {NavItemRender('Voyager', BrowserUrls.voyager)}
            </DesignNavbar.Item>
          </>
        ) : null}
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
