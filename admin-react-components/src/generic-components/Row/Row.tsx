import React from 'react';
import type { LayoutProps, SpacingSize } from '../..';
import { gapClassName, joinClassNames } from '../../utils/ClassNameUtils';

export interface RowProps {
  className?: string;
  gap?: SpacingSize;
  children: React.ReactNode;
}

export type RowAsProps<AsProps extends LayoutProps> = AsProps &
  RowProps & {
    as?: React.JSXElementConstructor<AsProps>;
  };

export type RowAsElementProps<
  Tag extends keyof JSX.IntrinsicElements
> = JSX.IntrinsicElements[Tag] &
  RowProps & {
    as: Tag;
  };

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

export function Row({ className, gap, children }: RowProps): JSX.Element {
  return (
    <div className={joinClassNames('dd flex-row', className, gapClassName(gap))}>{children}</div>
  );
}

export function RowAs<AsProps extends LayoutProps>({
  as,
  className,
  gap,
  children,
  ...args
}: RowAsProps<AsProps>): JSX.Element {
  const Element = as ?? 'div';
  return (
    <Element
      className={joinClassNames('dd flex-row', className, gapClassName(gap))}
      {...((args as unknown) as AsProps)}
    >
      {children}
    </Element>
  );
}

export function RowAsElement<Tag extends keyof JSX.IntrinsicElements>({
  as,
  className,
  gap,
  children,
  ...args
}: RowAsElementProps<Tag>): JSX.Element {
  const Element = as as keyof JSX.IntrinsicElements;
  return (
    <Element
      className={joinClassNames('dd flex-row', className, gapClassName(gap))}
      {...(args as unknown)}
    >
      {children}
    </Element>
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
