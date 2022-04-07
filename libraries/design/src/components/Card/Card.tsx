import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

export interface CardProps {
  children: ReactNode;
}

interface CardHeaderProps {
  children?: ReactNode;
}

interface CardHeaderTitleProps {
  children?: ReactNode;
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

Card.HeaderTitle = ({ children }: CardHeaderProps) => {
  return <p className="card-header-title">{children}</p>;
};
Card.HeaderTitle.displayName = 'Card.HeaderTitle';

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
