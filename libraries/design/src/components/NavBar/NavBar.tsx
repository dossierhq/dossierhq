import type { FunctionComponent } from 'react';
import React from 'react';
import { Navbar as BulmaNavBar } from 'react-bulma-components';
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
  return <BulmaNavBar>{children}</BulmaNavBar>;
};
NavBar.displayName = 'NavBar';

NavBar.Brand = ({ children }: NavBarBrandProps) => {
  return <BulmaNavBar.Brand>{children}</BulmaNavBar.Brand>;
};
NavBar.Brand.displayName = 'NavBar.Brand';

NavBar.Item = ({ active, children }: NavBarItemProps) => {
  const className = toClassName('navbar-item', active && 'is-active');
  return children({ className });
};
NavBar.Item.displayName = 'NavBar.Item';
