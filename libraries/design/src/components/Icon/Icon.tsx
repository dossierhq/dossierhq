import {
  faChevronDown,
  faChevronUp,
  faFastBackward,
  faFastForward,
  faMapMarkedAlt,
  faPlusSquare,
  faSearch,
  faSortDown,
  faSortUp,
  faStepBackward,
  faStepForward,
  faThList,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Icon as BulmaIcon } from 'react-bulma-components';
import { toClassName } from '../../utils/ClassNameUtils';

export interface IconProps {
  className?: string;
  icon?: IconName | null;
  text?: boolean;
}

const icons = {
  add: faPlusSquare,
  chevronDown: faChevronDown,
  chevronUp: faChevronUp,
  first: faFastBackward,
  last: faFastForward,
  list: faThList,
  map: faMapMarkedAlt,
  next: faStepForward,
  orderAsc: faSortDown,
  orderDesc: faSortUp,
  previous: faStepBackward,
  search: faSearch,
};

export type IconName = keyof typeof icons;

export function Icon({ className, icon, text }: IconProps): JSX.Element {
  const iconImage = icon ? icons[icon] : null;
  const bulmaIcon = (
    <BulmaIcon className={!text ? className : undefined}>
      {iconImage ? <FontAwesomeIcon icon={iconImage} /> : null}
    </BulmaIcon>
  );
  if (text) {
    return <span className={toClassName(className, 'icon-text')}>{bulmaIcon}</span>;
  }
  return bulmaIcon;
}
