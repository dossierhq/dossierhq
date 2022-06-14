import type { CSSProperties } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface IconProps {
  className?: string;
  style?: CSSProperties;
  icon?: IconName | null;
  text?: boolean;
  size?: 'small' | '' | 'medium' | 'large';
}

export const ICON_NAMES = [
  'add',
  'chevronDown',
  'chevronUp',
  'close',
  'download',
  'first',
  'last',
  'linkFrom',
  'linkTo',
  'list',
  'location',
  'map',
  'next',
  'orderAsc',
  'orderDesc',
  'ordered',
  'previous',
  'search',
  'shuffle',
  'upload',
] as const;

export type IconName = typeof ICON_NAMES[number];

const containerSize = {
  small: 'is-small',
  medium: 'is-medium',
  large: 'is-large',
};

const assetSize = { small: 'icon-asset-s', medium: 'icon-asset-m', large: 'icon-asset-l' } as const;

export function Icon({ className, style, icon, text, size }: IconProps): JSX.Element {
  const bulmaIcon = (
    <span
      className={toClassName('icon', size && containerSize[size], !text && className)}
      style={text ? undefined : style}
    >
      <IconAsset icon={icon} size={size} />
    </span>
  );
  if (text) {
    return (
      <span className={toClassName(className, 'icon-text')} style={style}>
        {bulmaIcon}
      </span>
    );
  }
  return bulmaIcon;
}

export function IconAsset({
  icon,
  size,
}: {
  icon?: IconName | null;
  size?: 'small' | '' | 'medium' | 'large';
}) {
  return <span className={toClassName(`icon-asset icon-${icon}`, size && assetSize[size])} />;
}
