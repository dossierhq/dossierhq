import React from 'react';

interface Props {
  onSubmit: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export function Form({ onSubmit, onReset, children }: Props): JSX.Element {
  return (
    <form
      className="dd segment has-shadow has-background"
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
