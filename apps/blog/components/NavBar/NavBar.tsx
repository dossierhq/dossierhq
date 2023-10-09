'use client';
import { Icon, Navbar as DesignNavbar } from '@dossierhq/design';
import Image from 'next/image.js';
import Link from 'next/link';
import { useState } from 'react';
import { ENABLE_WEB_INTERFACE } from '../../config/WebInterfaceConfig';
import githubLogo from '../../public/github-mark.svg';
import logo from '../../public/logo.svg';
import { BrowserUrls } from '../../utils/BrowserUrls';

export function NavBar({
  current,
}: {
  current: 'home' | 'docs' | 'blog' | 'content' | 'published-content' | 'schema' | 'changelog';
}) {
  const [active, setActive] = useState(false);
  return (
    <DesignNavbar>
      <DesignNavbar.Brand>
        <DesignNavbar.Item active={current === 'home'}>
          {({ className }) => (
            <Link href={BrowserUrls.home}>
              <Image className={className} src={logo} alt="Dossier logo" height={36} priority />
            </Link>
          )}
        </DesignNavbar.Item>
        <DesignNavbar.Burger active={active} onClick={() => setActive(!active)} />
      </DesignNavbar.Brand>
      <DesignNavbar.Menu active={active}>
        <DesignNavbar.Item active={current === 'docs'}>
          {NavItemRender('Docs', BrowserUrls.docs)}
        </DesignNavbar.Item>
        <DesignNavbar.Item active={current === 'blog'}>
          {NavItemRender('Blog', BrowserUrls.blog)}
        </DesignNavbar.Item>
        {ENABLE_WEB_INTERFACE ? (
          <>
            <DesignNavbar.Item active={current === 'content'}>
              {NavItemRender('Content', BrowserUrls.content)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'published-content'}>
              {NavItemRender('Published content', BrowserUrls.publishedContent)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'schema'}>
              {NavItemRender('Schema', BrowserUrls.schemaEditor)}
            </DesignNavbar.Item>
            <DesignNavbar.Item active={current === 'changelog'}>
              {NavItemRender('Changelog', BrowserUrls.changelog)}
            </DesignNavbar.Item>
          </>
        ) : null}
        <DesignNavbar.Item>
          {({ className }) => (
            <Link className={className} href={BrowserUrls.playground()} target="_blank">
              Playground{' '}
              <Icon icon="openInNewWindow" text size="small" style={{ marginLeft: '0.5em' }} />
            </Link>
          )}
        </DesignNavbar.Item>
        <DesignNavbar.Item>
          {({ className }) => (
            <Link className={className} href={BrowserUrls.github}>
              <Image src={githubLogo} alt="Github logo" width={28} height={28} />
            </Link>
          )}
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
