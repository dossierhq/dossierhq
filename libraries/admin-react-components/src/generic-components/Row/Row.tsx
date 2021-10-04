import React from 'react';
import type { LayoutProps, SpacingSize } from '../../index.js';
import { gapClassName, joinClassNames } from '../../utils/ClassNameUtils.js';

export interface RowProps {
  className?: string;
  gap?: SpacingSize;
  children: React.ReactNode;
}

export type RowAsProps<AsProps extends LayoutProps> = AsProps &
  RowProps & {
    as?: React.JSXElementConstructor<AsProps>;
  };

export type RowAsElementProps<Tag extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[Tag] &
    RowProps & {
      as: Tag;
    };

interface RowItemSharedProps {
  grow?: boolean;
  height?: 0 | '100%';
  width?: 0 | '100%';
}

type RowItemProps<AsProps extends LayoutProps> = AsProps &
  RowItemSharedProps & {
    as?: React.JSXElementConstructor<AsProps>;
    children?: React.ReactNode;
  };

type RowElementProps<Tag extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[Tag] &
  RowItemSharedProps & {
    as?: Tag;
    children?: React.ReactNode;
  };

export function Row({ className, gap, children }: RowProps): JSX.Element {
  return (
    <div className={joinClassNames('dd-flex-row', className, gapClassName(gap))}>{children}</div>
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
      className={joinClassNames('dd-flex-row', className, gapClassName(gap))}
      {...(args as unknown as AsProps)}
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
      className={joinClassNames('dd-flex-row', className, gapClassName(gap))}
      {...(args as unknown)}
    >
      {children}
    </Element>
  );
}

function itemPropsAsClassName({
  className,
  grow,
  height,
  width,
}: {
  className: string | undefined;
  grow: boolean | undefined;
  height: 0 | '100%' | undefined;
  width: 0 | '100%' | undefined;
}) {
  return joinClassNames(
    grow ? 'dd-flex-grow' : '',
    height === 0 ? 'dd-h-0' : height === '100%' ? 'dd-h-100' : '',
    width === 0 ? 'dd-w-0' : width === '100%' ? 'dd-w-100' : '',
    className
  );
}

export function RowItem<AsProps extends LayoutProps>({
  as,
  className,
  grow,
  height,
  width,
  children,
  ...args
}: RowItemProps<AsProps>): JSX.Element {
  const Element = as ?? 'div';
  return (
    <Element
      className={itemPropsAsClassName({ className, grow, height, width })}
      {...(args as AsProps)}
    >
      {children}
    </Element>
  );
}

export function RowElement<Tag extends keyof JSX.IntrinsicElements = 'div'>({
  as,
  className,
  grow,
  height,
  width,
  children,
  ...args
}: RowElementProps<Tag>): JSX.Element {
  const Element = (as ?? 'div') as keyof JSX.IntrinsicElements;
  return (
    <Element
      className={itemPropsAsClassName({ className, grow, height, width })}
      {...(args as unknown)}
    >
      {children}
    </Element>
  );
}
