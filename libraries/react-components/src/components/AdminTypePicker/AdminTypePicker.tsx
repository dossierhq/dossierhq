import type { IconName } from '@dossierhq/design';
import { ButtonDropdown } from '@dossierhq/design';
import React, { useContext } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
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
  const { schema } = useContext(AdminDossierContext);

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