import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import type { DropdownItem } from '../Dropdown/Dropdown.js';
import { Dropdown } from '../Dropdown/Dropdown.js';
import type { IconName } from '../Icon/Icon.js';
import { Icon } from '../Icon/Icon.js';

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

interface CardHeaderIconButtonProps {
  icon: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
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
  disabled?: boolean;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

interface CardComponent extends FunctionComponent<CardProps> {
  Header: FunctionComponent<CardHeaderProps>;
  HeaderTitle: FunctionComponent<CardHeaderTitleProps>;
  HeaderDropdown: <TItem extends DropdownItem>(
    props: CardHeaderDropDownProps<TItem>,
    context?: unknown,
  ) => JSX.Element;
  HeaderIconButton: FunctionComponent<CardHeaderIconButtonProps>;
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
Card.HeaderDropdown = <TItem extends DropdownItem>({
  items,
  renderItem,
  onItemClick,
}: CardHeaderDropDownProps<TItem>) => {
  return (
    <Dropdown<HTMLButtonElement, TItem>
      left
      items={items}
      onItemClick={onItemClick}
      renderItem={renderItem}
      renderTrigger={(triggerRef, onOpenDropdown) => (
        <button
          ref={triggerRef}
          className="card-header-icon"
          onMouseDown={(event) => {
            event.preventDefault();
            onOpenDropdown();
          }}
        >
          <Icon icon="chevronDown" />
        </button>
      )}
    />
  );
};

Card.HeaderIconButton = ({ icon, onClick }: CardHeaderIconButtonProps) => {
  return (
    <button className="card-header-icon" onClick={onClick}>
      <Icon icon={icon} />
    </button>
  );
};
Card.HeaderIconButton.displayName = 'Card.HeaderIconButton';

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

Card.FooterButton = ({ value, disabled, children, onClick }: CardFooterButtonProps) => {
  return (
    <button
      className="card-footer-item button is-white card-footer-button"
      disabled={disabled}
      value={value}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
Card.FooterButton.displayName = 'Card.FooterButton';

Card.FooterItem = ({ children }: CardFooterItemProps) => {
  return <p className="card-footer-item">{children}</p>;
};
Card.FooterItem.displayName = 'Card.FooterItem';
