import React from 'react';

export type IconType = 'chevron-down' | 'open-window' | 'remove';

export const IconTypes: IconType[] = ['chevron-down', 'open-window', 'remove'];

export interface IconProps {
  icon: IconType;
}

export function Icon({ icon }: IconProps): JSX.Element {
  return <span className={`dd icon ${icon}`} />;
}
