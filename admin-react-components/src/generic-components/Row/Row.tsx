import React from 'react';
import { gapClassName, joinClassNames } from '../../utils/ClassNameUtils';

export interface RowProps {
  gap?: SpacingSize;
  children: React.ReactNode;
}

interface LayoutProps {
  className?: string;
}

type RowItemProps<AsProps extends LayoutProps> = AsProps & {
  as?: React.JSXElementConstructor<AsProps>;
  grow?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type RowElementProps<Tag extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[Tag] & {
  as?: Tag;
  grow?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Row({ gap, children }: RowProps): JSX.Element {
  return <div className={joinClassNames('dd flex-row', gapClassName(gap))}>{children}</div>;
}

function itemPropsAsClassName({
  className,
  grow,
}: {
  className: string | undefined;
  grow: boolean | undefined;
}) {
  return joinClassNames('dd', grow ? 'flex-grow' : '', className);
}

export function RowItem<AsProps extends LayoutProps>({
  as,
  className,
  grow,
  children,
  ...args
}: RowItemProps<AsProps>): JSX.Element {
  const Element = as ?? 'div';
  return (
    <Element className={itemPropsAsClassName({ className, grow })} {...(args as AsProps)}>
      {children}
    </Element>
  );
}

export function RowElement<Tag extends keyof JSX.IntrinsicElements = 'div'>({
  as,
  className,
  grow,
  children,
  ...args
}: RowElementProps<Tag>): JSX.Element {
  const Element = (as ?? 'div') as keyof JSX.IntrinsicElements;
  return (
    <Element className={itemPropsAsClassName({ className, grow })} {...(args as unknown)}>
      {children}
    </Element>
  );
}
