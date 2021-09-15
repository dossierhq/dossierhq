import React from 'react';
import type { Kind } from '../..';
import { Loader, Stack } from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';
import { kindToClassName } from '../../utils/KindUtils';

export interface ButtonProps {
  id?: string;
  className?: string;
  type?: 'button' | 'reset' | 'submit';
  kind?: Kind;
  disabled?: boolean;
  selected?: boolean;
  rounded?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  id,
  className,
  type,
  kind,
  disabled,
  selected,
  loading,
  rounded,
  onClick,
  children,
}: ButtonProps): JSX.Element {
  return (
    <button
      id={id}
      className={joinClassNames(
        'dd-button dd-has-background dd-hoverable dd-text-button',
        className,
        kindToClassName(kind),
        selected ? 'dd-is-selected' : '',
        rounded === false ? '' : 'dd-is-rounded'
      )}
      type={type ?? 'button'}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled}
    >
      {loading ? (
        <Stack>
          <Stack.CenterLayer>
            <Loader />
          </Stack.CenterLayer>
          <div className="dd-dim">{children}</div>
        </Stack>
      ) : (
        children
      )}
    </button>
  );
}
