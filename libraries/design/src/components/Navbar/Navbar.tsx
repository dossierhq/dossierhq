import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface NavbarProps {
  children: ReactNode;
}

export interface NavbarBrandProps {
  children: ReactNode;
}

export interface NavbarBurgerProps {
  active: boolean;
  onClick: MouseEventHandler<HTMLAnchorElement>;
}

export interface NavbarMenuProps {
  active: boolean;
  children: ReactNode;
}

export interface NavbarStartProps {
  children: ReactNode;
}

export interface NavbarEndProps {
  children: ReactNode;
}

export interface NavbarItemProps {
  active?: boolean;
  children: ({ className }: { className: string }) => React.ReactElement;
}

export interface NavbarDropdownProps {
  left?: boolean;
  renderLink: (className: string) => React.ReactElement;
  children: ReactNode;
}

export interface NavbarDropdownContentItemProps {
  children: ReactNode;
}

interface NavbarComponent extends FunctionComponent<NavbarProps> {
  Brand: FunctionComponent<NavbarBrandProps>;
  Burger: FunctionComponent<NavbarBurgerProps>;
  Menu: FunctionComponent<NavbarMenuProps>;
  Start: FunctionComponent<NavbarStartProps>;
  End: FunctionComponent<NavbarEndProps>;
  Item: FunctionComponent<NavbarItemProps>;
  Dropdown: FunctionComponent<NavbarDropdownProps>;
  DropdownDivider: FunctionComponent;
  DropdownContentItem: FunctionComponent<NavbarDropdownContentItemProps>;
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

Navbar.Start = ({ children }: NavbarStartProps) => {
  return <div className="navbar-start">{children}</div>;
};
Navbar.Start.displayName = 'Navbar.Start';

Navbar.End = ({ children }: NavbarEndProps) => {
  return <div className="navbar-end">{children}</div>;
};
Navbar.End.displayName = 'Navbar.End';

Navbar.Item = ({ active, children }: NavbarItemProps) => {
  const className = toClassName('navbar-item', active && 'is-active');
  return children({ className });
};
Navbar.Item.displayName = 'Navbar.Item';

Navbar.Dropdown = ({ left, renderLink, children }: NavbarDropdownProps) => {
  return (
    <div className="navbar-item has-dropdown is-hoverable">
      {renderLink('navbar-link')}
      <div className={toClassName('navbar-dropdown', left && 'is-right')}>{children}</div>
    </div>
  );
};
Navbar.Dropdown.displayName = 'Navbar.Dropdown';

Navbar.DropdownDivider = () => {
  return <hr className="navbar-divider" />;
};
Navbar.DropdownDivider.displayName = 'Navbar.DropdownDivider';

Navbar.DropdownContentItem = ({ children }: NavbarDropdownContentItemProps) => {
  return <p className="navbar-item">{children}</p>;
};
Navbar.DropdownContentItem.displayName = 'Navbar.ContentItem';
