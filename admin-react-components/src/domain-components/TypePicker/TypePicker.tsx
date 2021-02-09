import type { EntityTypeSpecification, Schema, ValueTypeSpecification } from '@datadata/core';
import React from 'react';
import { DropDown } from '../../';
import type { DropDownItem } from '../../generic-components/DropDown/DropDown';

export interface TypePickerProps {
  id?: string;
  text: string;
  schema: Schema;
  showEntityTypes?: boolean;
  entityTypes?: string[];
  showValueTypes?: boolean;
  valueTypes?: string[];
  onTypeSelected: (type: string) => void;
}

export function TypePicker({
  id,
  text,
  schema,
  showEntityTypes,
  entityTypes,
  showValueTypes,
  valueTypes,
  onTypeSelected,
}: TypePickerProps): JSX.Element {
  const items: DropDownItem[] = [];
  if (showEntityTypes) {
    items.push(...gatherItems(schema.spec.entityTypes, entityTypes));
  }
  if (showValueTypes) {
    items.push(...gatherItems(schema.spec.valueTypes, valueTypes));
  }

  return (
    <DropDown id={id} text={text} items={items} onItemClick={(item) => onTypeSelected(item.key)} />
  );
}

function gatherItems(
  typeSpecs: (EntityTypeSpecification | ValueTypeSpecification)[],
  filterNames: string[] | undefined
): DropDownItem[] {
  let types = typeSpecs.map((x) => x.name);
  if (filterNames && filterNames.length > 0) {
    types = types.filter((x) => filterNames.indexOf(x) >= 0);
  }
  return types.map((t) => ({ key: t, text: t }));
}
