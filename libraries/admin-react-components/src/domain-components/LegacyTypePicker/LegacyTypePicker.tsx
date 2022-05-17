import type {
  AdminEntityTypeSpecification,
  AdminValueTypeSpecification,
} from '@jonasb/datadata-core';
import type { IconName } from '@jonasb/datadata-design';
import { ButtonDropdown } from '@jonasb/datadata-design';
import React, { useContext } from 'react';
import { LegacyDataDataContext } from '../../contexts/LegacyDataDataContext';

export interface LegacyTypePickerProps {
  text: string;
  iconLeft?: IconName;
  showEntityTypes?: boolean;
  entityTypes?: string[];
  showValueTypes?: boolean;
  valueTypes?: string[];
  onTypeSelected: (type: string) => void;
}

interface Item {
  id: string;
  name: string;
}

export function LegacyTypePicker({
  text,
  iconLeft,
  showEntityTypes,
  entityTypes,
  showValueTypes,
  valueTypes,
  onTypeSelected,
}: LegacyTypePickerProps): JSX.Element {
  const { schema } = useContext(LegacyDataDataContext);

  const items: Item[] = [];
  if (showEntityTypes) {
    items.push(...gatherItems(schema.spec.entityTypes, entityTypes));
  }
  if (showValueTypes) {
    items.push(...gatherItems(schema.spec.valueTypes, valueTypes));
  }

  return (
    <ButtonDropdown
      iconLeft={iconLeft}
      items={items}
      renderItem={(item) => item.name}
      onItemClick={(item) => onTypeSelected(item.id)}
    >
      {text}
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
