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
}

const icons = {
  add: faPlusSquare,
  chevronDown: faChevronDown,
  chevronUp: faChevronUp,
  list: faThList,
  map: faMapMarkedAlt,
  search: faSearch,
  orderDown: faSortDown,
  orderUp: faSortUp,
};

export type IconName = keyof typeof icons;

export function Icon({ icon }: IconProps): JSX.Element {
  const iconImage = icon ? icons[icon] : null;
  return <BulmaIcon>{iconImage ? <FontAwesomeIcon icon={iconImage} /> : null}</BulmaIcon>;
}
