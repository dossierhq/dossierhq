import type { JSX } from 'react';

interface Props {
  children: React.ReactNode;
}

export function Badge({ children }: Props): JSX.Element {
  return <span className="badge is-info">{children}</span>;
}
