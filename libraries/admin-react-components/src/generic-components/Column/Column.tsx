import React from 'react';
import type { LayoutProps, SpacingSize } from '../../types/LayoutTypes';
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

export type ColumnAsElementProps<Tag extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[Tag] &
    ColumnProps & {
      as: Tag;
    };

interface ColumnItemSharedProps {
  grow?: boolean;
  height?: 0 | '100%';
  width?: 0 | '100%';
  overflowY?: 'scroll';
}

type ColumnItemProps<AsProps extends LayoutProps> = AsProps &
  ColumnItemSharedProps & {
    as?: React.JSXElementConstructor<AsProps>;
    children?: React.ReactNode;
  };

type ColumnElementProps<Tag extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[Tag] &
  ColumnItemSharedProps & {
    as?: Tag;
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
      {...(args as unknown as AsProps)}
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
  return joinClassNames('dd-flex-column', className, gapClassName(gap));
}

function itemPropsAsClassName({
  className,
  grow,
  height,
  width,
  overflowY,
}: {
  className: string | undefined;
  grow: boolean | undefined;
  height: 0 | '100%' | undefined;
  width: 0 | '100%' | undefined;
  overflowY: 'scroll' | undefined;
}) {
  return joinClassNames(
    grow ? 'dd-flex-grow' : '',
    overflowY === 'scroll' ? 'dd-overflow-y-scroll' : '',
    height === 0 ? 'dd-h-0' : height === '100%' ? 'dd-h-100' : '',
    width === 0 ? 'dd-w-0' : width === '100%' ? 'dd-w-100' : '',
    className
  );
}

export function ColumnItem<AsProps extends LayoutProps>({
  as,
  className,
  grow,
  height,
  width,
  overflowY,
  children,
  ...args
}: ColumnItemProps<AsProps>): JSX.Element {
  const Element = as ?? 'div';
  return (
    <Element
      className={itemPropsAsClassName({ className, grow, height, width, overflowY })}
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
  height,
  width,
  overflowY,
  children,
  ...args
}: ColumnElementProps<Tag>): JSX.Element {
  const Element = (as ?? 'div') as keyof JSX.IntrinsicElements;
  return (
    <Element
      className={itemPropsAsClassName({ className, grow, height, width, overflowY })}
      {...(args as unknown)}
    >
      {children}
    </Element>
  );
}
