import type { MouseEventHandler } from 'react';

interface DeleteProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function Delete({ onClick }: DeleteProps) {
  return <button className="delete" onClick={onClick} />;
}
