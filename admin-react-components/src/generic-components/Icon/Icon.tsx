import React from 'react';

export type IconType = 'open-window' | 'remove';

export const IconTypes: IconType[] = ['open-window', 'remove'];

export interface IconProps {
  icon: IconType;
}

export function Icon({ icon }: IconProps): JSX.Element {
  return <span className={`dd icon ${icon}`} />;
}
