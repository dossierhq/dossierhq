'use client';

import { Navbar as DesignNavbar } from '@jonasb/datadata-design';
import Image from 'next/image.js';
import Link from 'next/link';
import { useState } from 'react';
import { USE_IN_BROWSER_SERVER } from '../../config/InBrowserServerConfig';
import logo from '../../public/logo.svg';
import { BrowserUrls } from '../../utils/BrowserUrls';
import { LinkButton } from '../LinkButton/LinkButton';

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
          {({ className }) => (
            <Link href={BrowserUrls.home}>
              <Image
                className={className}
                src={logo}
                alt="Data data logo"
                width={112}
                height={28}
              />
            </Link>
          )}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Item active={current === 'docs'}>
          {NavItemRender('Docs', BrowserUrls.docs)}
        </DesignNavbar.Item>
        <DesignNavbar.Dropdown renderLink={(className) => <a className={className}>Admin</a>}>
          <DesignNavbar.Item active={current === 'admin-entities'}>
            {NavItemRender('Admin entities', BrowserUrls.adminEntities)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'published-entities'}>
            {NavItemRender('Published entities', BrowserUrls.publishedEntities)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'schema'}>
            {NavItemRender('Schema', BrowserUrls.schemaEditor)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'graphiql'}>
            {NavItemRender('GraphiQL', BrowserUrls.graphiql)}
          </DesignNavbar.Item>
          <DesignNavbar.Item active={current === 'voyager'}>
            {NavItemRender('Voyager', BrowserUrls.voyager)}
          </DesignNavbar.Item>
          {USE_IN_BROWSER_SERVER ? (
            <>
              <DesignNavbar.DropdownDivider />
              <DesignNavbar.DropdownContentItem>
                ⚠️ Changes to the database will only
                <br />
                be stored in your browser and will
                <br />
                be reset when refreshing the page.
              </DesignNavbar.DropdownContentItem>
            </>
          ) : null}
        </DesignNavbar.Dropdown>
        <DesignNavbar.End>
          <DesignNavbar.Item>
            {({ className }) => (
              <div className={className}>
                <LinkButton
                  href={BrowserUrls.playground()}
                  iconRight="openInNewWindow"
                  target="_blank"
                >
                  Playground
                </LinkButton>
              </div>
            )}
          </DesignNavbar.Item>
        </DesignNavbar.End>
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
