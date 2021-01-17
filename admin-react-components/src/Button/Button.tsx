import React from 'react';

export interface ButtonProps {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ className, disabled, onClick, children }: ButtonProps): JSX.Element {
  return (
    <button
      className={`dd button text-button ${className ?? ''}`}
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
