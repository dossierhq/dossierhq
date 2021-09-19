import type { FunctionComponent } from 'react';
import React from 'react';
import { Navbar as BulmaNavBar } from 'react-bulma-components';

export interface NavBarProps {
  children: React.ReactNode;
}

export interface NavBarBrandProps {
  children: React.ReactNode;
}

export interface NavBarItemProps {
  active?: boolean;
  children: React.ReactNode;
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
  return <BulmaNavBar.Item active={active}>{children}</BulmaNavBar.Item>;
};
NavBar.Item.displayName = 'NavBar.Item';
