import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

export interface CardProps {
  children: ReactNode;
}

interface CardHeaderProps {
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

interface CardComponent extends FunctionComponent<CardProps> {
  Header: FunctionComponent<CardHeaderProps>;
  Content: FunctionComponent<CardContentProps>;
  Footer: FunctionComponent<CardFooterProps>;
  FooterItem: FunctionComponent<CardFooterItemProps>;
}

export const Card: CardComponent = ({ children }: CardProps) => {
  return <div className="card">{children}</div>;
};
Card.displayName = 'Card';

Card.Header = ({ children }: CardHeaderProps) => {
  return (
    <header className="card-header">
      <p className="card-header-title">{children}</p>
    </header>
  );
};
Card.Header.displayName = 'Card.Header';

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

Card.FooterItem = ({ children }: CardFooterItemProps) => {
  return <a className="card-footer-item">{children}</a>;
};
Card.FooterItem.displayName = 'Card.FooterItem';
