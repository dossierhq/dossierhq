import React from 'react';
import { Loader, Stack } from '../..';

export interface ButtonProps {
  id?: string;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  id,
  className,
  type,
  disabled,
  loading,
  onClick,
  children,
}: ButtonProps): JSX.Element {
  return (
    <button
      id={id}
      className={`dd button text-button ${className ?? ''}`}
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
