import React from 'react';
import type { Kind } from '../..';
import { Loader, Stack } from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';
import { kindToClassName } from '../../utils/KindUtils';

export interface ButtonProps {
  id?: string;
  type?: 'button' | 'reset' | 'submit';
  kind?: Kind;
  disabled?: boolean;
  selected?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  id,
  type,
  kind,
  disabled,
  selected,
  loading,
  onClick,
  children,
}: ButtonProps): JSX.Element {
  return (
    <button
      id={id}
      className={joinClassNames(
        'dd button has-background hoverable text-button',
        kindToClassName(kind),
        selected ? 'is-selected' : ''
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
          <div className="dd dim">{children}</div>
        </Stack>
      ) : (
        children
      )}
    </button>
  );
}
