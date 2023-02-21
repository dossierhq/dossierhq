import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { toFlexContainerClassName, toFlexItemClassName } from '../../utils/FlexboxUtils.js';
import { toSpacingClassName } from '../../utils/LayoutPropsUtils.js';
import type { IconName } from '../Icon/Icon.js';
import { Icon } from '../Icon/Icon.js';
import type { TagProps } from '../Tag/Tag.js';
import { Tag } from '../Tag/Tag.js';
import { Text } from '../Text/Text.js';

export interface CardProps {
  className?: string;
  children: ReactNode;
}

interface CardHeaderProps {
  noIcons?: boolean;
  children?: ReactNode;
}

interface CardHeaderTitleProps {
  children?: ReactNode;
}

interface CardHeaderTagProps {
  children: TagProps['children'];
}

interface CardHeaderIconButtonProps {
  icon: IconName;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

interface CardMediaProps {
  children?: ReactNode;
}

interface CardContentProps {
  style?: React.CSSProperties;
  noPadding?: boolean;
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
  HeaderTag: FunctionComponent<CardHeaderTagProps>;
  HeaderIconButton: FunctionComponent<CardHeaderIconButtonProps>;
  Media: FunctionComponent<CardMediaProps>;
  Content: FunctionComponent<CardContentProps>;
  Footer: FunctionComponent<CardFooterProps>;
  FooterButton: FunctionComponent<CardFooterButtonProps>;
  FooterItem: FunctionComponent<CardFooterItemProps>;
}

export const Card2: CardComponent = ({ className, children }: CardProps) => {
  return (
    <div
      className={toClassName(
        'is-card-container',
        toFlexContainerClassName({ flexDirection: 'column' }),
        className
      )}
    >
      {children}
    </div>
  );
};
Card2.displayName = 'Card2';

Card2.Header = ({ noIcons, children }: CardHeaderProps) => {
  //TODO cleanup border bottom
  return (
    <header
      className={toClassName(
        toFlexContainerClassName({ flexDirection: 'row', alignItems: 'center' }),
        toSpacingClassName(noIcons ? { paddingHorizontal: 3 } : { paddingLeft: 3 })
      )}
      style={{ borderBottom: '1px solid hsl(0deg, 0%, 93%)' }}
    >
      {children}
    </header>
  );
};
Card2.Header.displayName = 'Card2.Header';

Card2.HeaderTitle = ({ children }: CardHeaderTitleProps) => {
  return (
    <Text
      className={toClassName(
        toFlexItemClassName({ flexGrow: 1 }),
        toSpacingClassName({ paddingVertical: 2 })
      )}
      textStyle="headline5"
      marginBottom={0}
    >
      {children}
    </Text>
  );
};
Card2.HeaderTitle.displayName = 'Card2.HeaderTitle';

Card2.HeaderTag = ({ children }: CardHeaderTagProps) => {
  return <Tag className={toSpacingClassName({ marginLeft: 2 })}>{children}</Tag>;
};
Card2.HeaderTag.displayName = 'Card2.HeaderTag';

Card2.HeaderIconButton = ({ icon, onClick }: CardHeaderIconButtonProps) => {
  //TODO stop using card-header-icon class
  return (
    <button className="card-header-icon" onClick={onClick}>
      <Icon icon={icon} />
    </button>
  );
};
Card2.HeaderIconButton.displayName = 'Card2.HeaderIconButton';

Card2.Media = ({ children }: CardMediaProps) => {
  return <div className="card-media">{children}</div>;
};
Card2.Media.displayName = 'Card2.Media';

Card2.Content = ({ style, noPadding, children }: CardContentProps) => {
  return (
    <div
      className={toClassName(
        noPadding ? '' : toSpacingClassName({ paddingHorizontal: 3, paddingVertical: 2 }),
        toFlexContainerClassName({ flexDirection: 'column' })
      )}
      style={style}
    >
      {children}
    </div>
  );
};
Card2.Content.displayName = 'Card2.Content';

Card2.Footer = ({ children }: CardFooterProps) => {
  //TODO stop using card-footer class
  return <footer className="card-footer">{children}</footer>;
};
Card2.Footer.displayName = 'Card2.Footer';

Card2.FooterButton = ({ value, disabled, children, onClick }: CardFooterButtonProps) => {
  //TODO stop using bulma card classes
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
Card2.FooterButton.displayName = 'Card2.FooterButton';

Card2.FooterItem = ({ children }: CardFooterItemProps) => {
  //TODO stop using bulma card classes
  return <p className="card-footer-item">{children}</p>;
};
Card2.FooterItem.displayName = 'Card2.FooterItem';
