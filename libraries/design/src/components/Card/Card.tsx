import type { FunctionComponent, ReactNode } from 'react';
import { useRef } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';
import React from 'react';
import type { DropdownItem } from '../Dropdown/Dropdown';
import { DropdownDisplay } from '../DropdownDisplay/DropdownDisplay';
import { Icon } from '../Icon/Icon';
import { useWindowClick } from '../../hooks/useWindowClick';

export interface CardProps {
  children: ReactNode;
}

interface CardHeaderProps {
  children?: ReactNode;
}

interface CardHeaderTitleProps {
  children?: ReactNode;
}

interface CardHeaderDropDownProps<TItem extends DropdownItem> {
  items: TItem[];
  renderItem: (item: TItem) => React.ReactNode;
  onItemClick?: (item: TItem) => void;
}

interface CardContentProps {
  children?: ReactNode;
}

interface CardFooterProps {
  children?: ReactNode;
}

interface CardFooterItemProps {
  children?: ReactNode;
}

interface CardFooterButtonProps {
  value?: string;
  children?: ReactNode;
}

interface CardComponent extends FunctionComponent<CardProps> {
  Header: FunctionComponent<CardHeaderProps>;
  HeaderTitle: FunctionComponent<CardHeaderTitleProps>;
  HeaderDropDown: <TItem extends DropdownItem>(
    props: CardHeaderDropDownProps<TItem>,
    context?: unknown
  ) => JSX.Element;
  Content: FunctionComponent<CardContentProps>;
  Footer: FunctionComponent<CardFooterProps>;
  FooterButton: FunctionComponent<CardFooterButtonProps>;
  FooterItem: FunctionComponent<CardFooterItemProps>;
}

export const Card: CardComponent = ({ children }: CardProps) => {
  return <div className="card">{children}</div>;
};
Card.displayName = 'Card';

Card.Header = ({ children }: CardHeaderProps) => {
  return <header className="card-header">{children}</header>;
};
Card.Header.displayName = 'Card.Header';

Card.HeaderTitle = ({ children }: CardHeaderTitleProps) => {
  return <p className="card-header-title">{children}</p>;
};
Card.HeaderTitle.displayName = 'Card.HeaderTitle';

// eslint-disable-next-line react/display-name
Card.HeaderDropDown = <TItem extends DropdownItem>({
  items,
  renderItem,
  onItemClick,
}: CardHeaderDropDownProps<TItem>) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [active, setActive] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleClose = useCallback(() => setActive(false), [setActive]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const triggerRef = useRef<HTMLButtonElement>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useWindowClick(triggerRef, handleClose, active);
  const trigger = (
    <button
      ref={triggerRef}
      className="card-header-icon"
      onMouseDown={(event) => {
        event.preventDefault();
        setActive((it) => !it);
      }}
    >
      <Icon icon={'chevronDown'} />
    </button>
  );
  return (
    <DropdownDisplay active={active} trigger={trigger} left>
      {items.map((item) => (
        <DropdownDisplay.Item key={item.id} onClick={() => onItemClick?.(item)}>
          {renderItem(item)}
        </DropdownDisplay.Item>
      ))}
    </DropdownDisplay>
  );
};

Card.Content = ({ children }: CardContentProps) => {
  return (
    <div className="card-content">
      <div className="content">{children}</div>
    </div>
  );
};
Card.Content.displayName = 'Card.Content';

Card.Footer = ({ children }: CardFooterProps) => {
  return <footer className="card-footer">{children}</footer>;
};
Card.Footer.displayName = 'Card.Footer';

Card.FooterButton = ({ value, children }: CardFooterButtonProps) => {
  return (
    <button className="card-footer-item button is-white card-footer-button" value={value}>
      {children}
    </button>
  );
};
Card.FooterButton.displayName = 'Card.FooterButton';

Card.FooterItem = ({ children }: CardFooterItemProps) => {
  return <p className="card-footer-item">{children}</p>;
};
Card.FooterItem.displayName = 'Card.FooterItem';
