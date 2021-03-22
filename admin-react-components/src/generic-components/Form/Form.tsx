import React from 'react';

interface Props {
  className?: string;
  onSubmit: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export function Form({ className, onSubmit, onReset, children }: Props): JSX.Element {
  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      onReset={(event) => {
        event.preventDefault();
        onReset?.();
      }}
    >
      {children}
    </form>
  );
}
