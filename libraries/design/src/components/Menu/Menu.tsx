import type { FunctionComponent, ReactNode } from 'react';

export interface MenuProps {
  children: ReactNode;
}

export interface MenuLabelProps {
  children: ReactNode;
}

export interface MenuListProps {
  children: React.ReactNode;
}

export interface MenuItemProps {
  active?: boolean;
  children: React.ReactNode;
}

interface MenuComponent extends FunctionComponent<MenuProps> {
  Label: FunctionComponent<MenuLabelProps>;
  List: FunctionComponent<MenuListProps>;
  Item: FunctionComponent<MenuItemProps>;
}

export const Menu: MenuComponent = ({ children }: MenuProps) => {
  return <aside className="menu">{children}</aside>;
};
Menu.displayName = 'Menu';

Menu.Label = ({ children }: MenuLabelProps) => {
  return <p className="menu-label">{children}</p>;
};
Menu.Label.displayName = 'Menu.Label';

Menu.List = ({ children }: MenuListProps) => {
  return <ul className="menu-list">{children}</ul>;
};
Menu.List.displayName = 'Menu.List';

Menu.Item = ({ children }: MenuItemProps) => {
  return <li>{children}</li>;
};
Menu.Item.displayName = 'Menu.Item';
