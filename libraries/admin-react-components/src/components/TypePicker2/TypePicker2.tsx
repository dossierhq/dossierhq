import type {
  AdminEntityTypeSpecification,
  AdminValueTypeSpecification,
} from '@jonasb/datadata-core';
import type { IconName } from '@jonasb/datadata-design';
import { Dropdown } from '@jonasb/datadata-design';
import React, { useContext } from 'react';
import { DataDataContext2 } from '../..';

export interface TypePicker2Props {
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

export function TypePicker2({
  iconLeft,
  showEntityTypes,
  entityTypes,
  showValueTypes,
  valueTypes,
  onTypeSelected,
  children,
}: TypePicker2Props): JSX.Element {
  const { schema } = useContext(DataDataContext2);

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
    <Dropdown
      iconLeft={iconLeft}
      items={items}
      renderItem={(item) => item.name}
      disabled={!schema}
      onItemClick={onTypeSelected ? (item) => onTypeSelected(item.id) : undefined}
    >
      {children}
    </Dropdown>
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
