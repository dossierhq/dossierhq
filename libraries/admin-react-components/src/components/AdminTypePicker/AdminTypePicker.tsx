import type { IconName } from '@jonasb/datadata-design';
import { ButtonDropdown } from '@jonasb/datadata-design';
import React, { useContext } from 'react';
import { AdminDataDataContext } from '../..';
import type { TypeSelectionFilter } from '../../utils/TypeSelectionUtils.js';
import { filterTypeSpecifications } from '../../utils/TypeSelectionUtils.js';

export interface AdminTypePickerProps extends TypeSelectionFilter {
  iconLeft?: IconName;
  onTypeSelected?: (type: string) => void;
  children: React.ReactNode;
}

interface Item {
  id: string;
  name: string;
}

export function AdminTypePicker({
  iconLeft,
  onTypeSelected,
  children,
  ...filter
}: AdminTypePickerProps): JSX.Element {
  const { schema } = useContext(AdminDataDataContext);

  let items: Item[] = [];
  if (schema) {
    items = filterTypeSpecifications(schema, filter).map((it) => ({ id: it.name, name: it.name }));
  }

  return (
    <ButtonDropdown
      iconLeft={iconLeft}
      items={items}
      renderItem={(item) => item.name}
      disabled={!schema || items.length === 0}
      onItemClick={onTypeSelected ? (item) => onTypeSelected(item.id) : undefined}
    >
      {children}
    </ButtonDropdown>
  );
}
