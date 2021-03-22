import React from 'react';
import type { LayoutProps, SpacingSize } from '../..';
import { gapClassName, joinClassNames } from '../../utils/ClassNameUtils';

export interface ColumnProps {
  className?: string;
  gap?: SpacingSize;
  children: React.ReactNode;
}

export type ColumnAsProps<AsProps extends LayoutProps> = AsProps &
  ColumnProps & {
    as?: React.JSXElementConstructor<AsProps>;
  };

export type ColumnAsElementProps<
  Tag extends keyof JSX.IntrinsicElements
> = JSX.IntrinsicElements[Tag] &
  ColumnProps & {
    as: Tag;
  };

type ColumnItemProps<AsProps extends LayoutProps> = AsProps & {
  as?: React.JSXElementConstructor<AsProps>;
  grow?: boolean;
  overflowY?: 'scroll';
  className?: string;
  children?: React.ReactNode;
};

type ColumnElementProps<Tag extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[Tag] & {
  as?: Tag;
  grow?: boolean;
  overflowY?: 'scroll';
  className?: string;
  children?: React.ReactNode;
};

export function Column({ className, gap, children }: ColumnProps): JSX.Element {
  return <div className={columnPropsAsClassName({ className, gap })}>{children}</div>;
}

export function ColumnAs<AsProps extends LayoutProps>({
  as,
  className,
  gap,
  children,
  ...args
}: ColumnAsProps<AsProps>): JSX.Element {
  const Element = as ?? 'div';
  return (
    <Element
      className={columnPropsAsClassName({ className, gap })}
      {...((args as unknown) as AsProps)}
    >
      {children}
    </Element>
  );
}

export function ColumnAsElement<Tag extends keyof JSX.IntrinsicElements>({
  as,
  className,
  gap,
  children,
  ...args
}: ColumnAsElementProps<Tag>): JSX.Element {
  const Element = as as keyof JSX.IntrinsicElements;
  return (
    <Element className={columnPropsAsClassName({ className, gap })} {...(args as unknown)}>
      {children}
    </Element>
  );
}

function columnPropsAsClassName({
  className,
  gap,
}: {
  className: string | undefined;
  gap: SpacingSize | undefined;
}) {
  return joinClassNames('dd flex-column', className, gapClassName(gap));
}

function itemPropsAsClassName({
  className,
  grow,
  overflowY,
}: {
  className: string | undefined;
  grow: boolean | undefined;
  overflowY: 'scroll' | undefined;
}) {
  return joinClassNames(
    'dd',
    grow ? 'flex-grow' : '',
    overflowY === 'scroll' ? 'overflow-y-scroll' : '',
    className
  );
}

export function ColumnItem<AsProps extends LayoutProps>({
  as,
  className,
  grow,
  overflowY,
  children,
  ...args
}: ColumnItemProps<AsProps>): JSX.Element {
  const Element = as ?? 'div';
  return (
    <Element
      className={itemPropsAsClassName({ className, grow, overflowY })}
      {...(args as AsProps)}
    >
      {children}
    </Element>
  );
}

export function ColumnElement<Tag extends keyof JSX.IntrinsicElements>({
  as,
  className,
  grow,
  overflowY,
  children,
  ...args
}: ColumnElementProps<Tag>): JSX.Element {
  const Element = (as ?? 'div') as keyof JSX.IntrinsicElements;
  return (
    <Element
      className={itemPropsAsClassName({ className, grow, overflowY })}
      {...(args as unknown)}
    >
      {children}
    </Element>
  );
}
