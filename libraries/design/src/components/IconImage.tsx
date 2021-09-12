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

interface Props {
  className?: string;
  icon: keyof typeof icons;
}

export function IconImage({ className, icon }: Props): JSX.Element {
  const i = icons[icon];
  return <FontAwesomeIcon className={className} icon={i} />;
}
