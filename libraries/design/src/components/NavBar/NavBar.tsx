import type { FunctionComponent } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface NavBarProps {
  children: React.ReactNode;
}

export interface NavBarBrandProps {
  children: React.ReactNode;
}

export interface NavBarItemProps {
  active?: boolean;
  children: ({ className }: { className: string }) => React.ReactElement;
}

interface NavBarComponent extends FunctionComponent<NavBarProps> {
  Brand: FunctionComponent<NavBarBrandProps>;
  Item: FunctionComponent<NavBarItemProps>;
}

export const NavBar: NavBarComponent = ({ children }: NavBarProps) => {
  return (
    <nav className="navbar" role="navigation">
      {children}
    </nav>
  );
};
NavBar.displayName = 'NavBar';

NavBar.Brand = ({ children }: NavBarBrandProps) => {
  return <div className="navbar-brand">{children}</div>;
};
NavBar.Brand.displayName = 'NavBar.Brand';

NavBar.Item = ({ active, children }: NavBarItemProps) => {
  const className = toClassName('navbar-item', active && 'is-active');
  return children({ className });
};
NavBar.Item.displayName = 'NavBar.Item';
