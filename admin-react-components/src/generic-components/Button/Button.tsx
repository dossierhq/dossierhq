import React from 'react';

export interface ButtonProps {
  id?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ id, className, disabled, onClick, children }: ButtonProps): JSX.Element {
  return (
    <button
      id={id}
      className={`dd button text-button ${className ?? ''}`}
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
