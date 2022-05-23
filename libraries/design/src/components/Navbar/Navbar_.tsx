import type { FunctionComponent, MouseEventHandler } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface NavbarProps {
  children: React.ReactNode;
}

export interface NavbarBrandProps {
  children: React.ReactNode;
}

export interface NavbarBurgerProps {
  active: boolean;
  onClick: MouseEventHandler<HTMLAnchorElement>;
}

export interface NavbarMenuProps {
  active: boolean;
  children: React.ReactNode;
}

export interface NavbarItemProps {
  active?: boolean;
  children: ({ className }: { className: string }) => React.ReactElement;
}

interface NavbarComponent extends FunctionComponent<NavbarProps> {
  Brand: FunctionComponent<NavbarBrandProps>;
  Burger: FunctionComponent<NavbarBurgerProps>;
  Menu: FunctionComponent<NavbarMenuProps>;
  Item: FunctionComponent<NavbarItemProps>;
}

export const Navbar: NavbarComponent = ({ children }: NavbarProps) => {
  return (
    <nav className="navbar" role="navigation">
      {children}
    </nav>
  );
};
Navbar.displayName = 'Navbar';

Navbar.Brand = ({ children }: NavbarBrandProps) => {
  return <div className="navbar-brand">{children}</div>;
};
Navbar.Brand.displayName = 'Navbar.Brand';

Navbar.Burger = ({ active, onClick }: NavbarBurgerProps) => {
  return (
    <a
      role="button"
      className={toClassName('navbar-burger', active && 'is-active')}
      onClick={onClick}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </a>
  );
};
Navbar.Burger.displayName = 'Navbar.Burger';

Navbar.Menu = ({ active, children }: NavbarMenuProps) => {
  return <div className={toClassName('navbar-menu', active && 'is-active')}>{children}</div>;
};
Navbar.Menu.displayName = 'Navbar.Menu';

Navbar.Item = ({ active, children }: NavbarItemProps) => {
  const className = toClassName('navbar-item', active && 'is-active');
  return children({ className });
};
Navbar.Item.displayName = 'Navbar.Item';
