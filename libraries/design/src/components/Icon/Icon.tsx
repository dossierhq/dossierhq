import * as svgIcons from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

export const icons = {
  add: svgIcons.faPlusSquare,
  chevronDown: svgIcons.faChevronDown,
  chevronUp: svgIcons.faChevronUp,
  close: svgIcons.faXmark,
  download: svgIcons.faDownload,
  first: svgIcons.faFastBackward,
  last: svgIcons.faFastForward,
  list: svgIcons.faThList,
  location: svgIcons.faLocationPin,
  map: svgIcons.faMapMarkedAlt,
  next: svgIcons.faStepForward,
  orderAsc: svgIcons.faSortDown,
  orderDesc: svgIcons.faSortUp,
  ordered: svgIcons.faArrowDownShortWide,
  previous: svgIcons.faStepBackward,
  search: svgIcons.faSearch,
  shuffle: svgIcons.faShuffle,
  upload: svgIcons.faUpload,
};

export type IconName = keyof typeof icons;

const containerSize = {
  small: 'is-small',
  medium: 'is-medium',
  large: 'is-large',
};

const iconSize = {
  small: 'sm',
  medium: 'lg',
  large: '2x',
} as const;

export function Icon({ className, style, icon, text, size }: IconProps): JSX.Element {
  const iconImage = icon ? icons[icon] : null;
  const bulmaIcon = (
    <span
      className={toClassName('icon', size && containerSize[size], !text && className)}
      style={text ? undefined : style}
    >
      {iconImage ? (
        <FontAwesomeIcon icon={iconImage} size={size ? iconSize[size] : undefined} />
      ) : null}
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
