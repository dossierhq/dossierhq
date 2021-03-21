import React from 'react';
import { gapClassName, joinClassNames } from '../../utils/ClassNameUtils';

export interface ColumnProps {
  className?: string;
  gap?: SpacingSize;
  children: React.ReactNode;
}

type ColumnItemProps<AsProps extends LayoutProps> = AsProps & {
  as?: React.JSXElementConstructor<AsProps>;
  grow?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ColumnElementProps<Tag extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[Tag] & {
  as?: Tag;
  grow?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Column({ className, gap, children }: ColumnProps): JSX.Element {
  return (
    <ColumnItem className={joinClassNames('dd flex-column', className, gapClassName(gap))}>
      {children}
    </ColumnItem>
  );
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

export function ColumnItem<AsProps extends LayoutProps>({
  as,
  className,
  grow,
  children,
  ...args
}: ColumnItemProps<AsProps>): JSX.Element {
  const Element = as ?? 'div';
  return (
    <Element className={itemPropsAsClassName({ className, grow })} {...(args as AsProps)}>
      {children}
    </Element>
  );
}

export function ColumnElement<Tag extends keyof JSX.IntrinsicElements = 'div'>({
  as,
  className,
  grow,
  children,
  ...args
}: ColumnElementProps<Tag>): JSX.Element {
  const Element = (as ?? 'div') as keyof JSX.IntrinsicElements;
  return (
    <Element className={itemPropsAsClassName({ className, grow })} {...(args as unknown)}>
      {children}
    </Element>
  );
}
