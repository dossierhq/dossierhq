import React from 'react';

export type LoaderProps = Record<string, never>;

export function Loader(): JSX.Element {
  return <div className="dd-loader" />;
}
