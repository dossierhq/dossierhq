'use client';

import { ClassName, Menu } from '@dossierhq/design';
import Link from 'next/link.js';
import { useSelectedLayoutSegments } from 'next/navigation';

export function MenuLinkItem({
  href,
  activeSegments,
  children,
}: {
  href: string;
  activeSegments: string[];
  children: React.ReactNode;
}) {
  const selectedSegments = useSelectedLayoutSegments();
  const isActive =
    selectedSegments.length === activeSegments.length &&
    selectedSegments.every((segment, index) => segment === activeSegments[index]);

  return (
    <Menu.Item>
      <Link className={isActive ? ClassName['is-active'] : ''} href={href}>
        {children}
      </Link>
    </Menu.Item>
  );
}
