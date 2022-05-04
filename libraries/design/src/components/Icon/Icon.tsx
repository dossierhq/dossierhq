import {
  faArrowDownShortWide,
  faChevronDown,
  faChevronUp,
  faFastBackward,
  faFastForward,
  faMapMarkedAlt,
  faPlusSquare,
  faSearch,
  faShuffle,
  faSortDown,
  faSortUp,
  faStepBackward,
  faStepForward,
  faThList,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface IconProps {
  className?: string;
  icon?: IconName | null;
  text?: boolean;
  size?: 'small' | '' | 'medium' | 'large';
}

const icons = {
  add: faPlusSquare,
  chevronDown: faChevronDown,
  chevronUp: faChevronUp,
  close: faXmark,
  first: faFastBackward,
  last: faFastForward,
  list: faThList,
  map: faMapMarkedAlt,
  next: faStepForward,
  orderAsc: faSortDown,
  orderDesc: faSortUp,
  ordered: faArrowDownShortWide,
  previous: faStepBackward,
  search: faSearch,
  shuffle: faShuffle,
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

export function Icon({ className, icon, text, size }: IconProps): JSX.Element {
  const iconImage = icon ? icons[icon] : null;
  const bulmaIcon = (
    <span className={toClassName('icon', size && containerSize[size], !text && className)}>
      {iconImage ? (
        <FontAwesomeIcon icon={iconImage} size={size ? iconSize[size] : undefined} />
      ) : null}
    </span>
  );
  if (text) {
    return <span className={toClassName(className, 'icon-text')}>{bulmaIcon}</span>;
  }
  return bulmaIcon;
}
