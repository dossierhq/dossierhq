import React from 'react';

export interface ButtonProps {
  id?: string;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  id,
  className,
  type,
  disabled,
  onClick,
  children,
}: ButtonProps): JSX.Element {
  return (
    <button
      id={id}
      className={`dd button text-button ${className ?? ''}`}
      type={type ?? 'button'}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
