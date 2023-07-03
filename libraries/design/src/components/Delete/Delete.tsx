import type { MouseEventHandler } from 'react';

export interface DeleteProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function Delete({ onClick }: DeleteProps) {
  return <button className="delete" onClick={onClick} />;
}
