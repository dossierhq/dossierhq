import type {
  AdminEntityTypeSpecification,
  AdminSchema,
  AdminValueTypeSpecification,
} from '@dossierhq/core';

export interface TypeSelectionFilter {
  showEntityTypes?: boolean;
  entityTypes?: string[];
  showValueTypes?: boolean;
  valueTypes?: string[];
}

type Item = AdminEntityTypeSpecification | AdminValueTypeSpecification;

export function filterTypeSpecifications(schema: AdminSchema, filter: TypeSelectionFilter): Item[] {
  const items: Item[] = [];
  if (filter.showEntityTypes) {
    items.push(...filterItems(schema.spec.entityTypes, filter.entityTypes));
  }
  if (filter.showValueTypes) {
    items.push(...filterItems(schema.spec.valueTypes, filter.valueTypes));
  }
  return items;
}

function filterItems(items: Item[], filterNames: string[] | undefined): Item[] {
  let types = items;
  if (filterNames && filterNames.length > 0) {
    types = types.filter((it) => filterNames.indexOf(it.name) >= 0);
  }
  return types;
}