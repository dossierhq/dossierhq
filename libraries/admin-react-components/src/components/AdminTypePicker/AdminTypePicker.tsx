import type {
  AdminEntityTypeSpecification,
  AdminValueTypeSpecification,
} from '@jonasb/datadata-core';
import type { IconName } from '@jonasb/datadata-design';
import { ButtonDropdown } from '@jonasb/datadata-design';
import React, { useContext } from 'react';
import { AdminDataDataContext } from '../..';

export interface AdminTypePickerProps {
  iconLeft?: IconName;
  showEntityTypes?: boolean;
  entityTypes?: string[];
  showValueTypes?: boolean;
  valueTypes?: string[];
  onTypeSelected?: (type: string) => void;
  children: React.ReactNode;
}

interface Item {
  id: string;
  name: string;
}

export function AdminTypePicker({
  iconLeft,
  showEntityTypes,
  entityTypes,
  showValueTypes,
  valueTypes,
  onTypeSelected,
  children,
}: AdminTypePickerProps): JSX.Element {
  const { schema } = useContext(AdminDataDataContext);

  const items: Item[] = [];
  if (schema) {
    if (showEntityTypes) {
      items.push(...gatherItems(schema.spec.entityTypes, entityTypes));
    }
    if (showValueTypes) {
      items.push(...gatherItems(schema.spec.valueTypes, valueTypes));
    }
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

function gatherItems(
  typeSpecs: (AdminEntityTypeSpecification | AdminValueTypeSpecification)[],
  filterNames: string[] | undefined
): Item[] {
  let types = typeSpecs.map((x) => x.name);
  if (filterNames && filterNames.length > 0) {
    types = types.filter((it) => filterNames.indexOf(it) >= 0);
  }
  return types.map((it) => ({ id: it, name: it }));
}
