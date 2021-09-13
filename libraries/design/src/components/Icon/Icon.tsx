import {
  faChevronDown,
  faChevronUp,
  faMapMarkedAlt,
  faPlusSquare,
  faSearch,
  faSortDown,
  faSortUp,
  faThList,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Icon as BulmaIcon } from 'react-bulma-components';

export interface IconProps {
  icon?: IconName | null;
  text?: boolean;
}

const icons = {
  add: faPlusSquare,
  chevronDown: faChevronDown,
  chevronUp: faChevronUp,
  list: faThList,
  map: faMapMarkedAlt,
  search: faSearch,
  orderAsc: faSortDown,
  orderDesc: faSortUp,
};

export type IconName = keyof typeof icons;

export function Icon({ icon, text }: IconProps): JSX.Element {
  const iconImage = icon ? icons[icon] : null;
  const hello = <BulmaIcon>{iconImage ? <FontAwesomeIcon icon={iconImage} /> : null}</BulmaIcon>;
  if (text) {
    return <span className="icon-text">{hello}</span>;
  }
  return hello;
}
