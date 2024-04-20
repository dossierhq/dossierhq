import type {
  AdminComponentTypeSpecification,
  AdminEntityTypeSpecification,
  Schema,
} from '@dossierhq/core';

export interface TypeSelectionFilter {
  showEntityTypes?: boolean;
  entityTypes?: string[];
  showComponentTypes?: boolean;
  componentTypes?: string[];
}

type Item = AdminEntityTypeSpecification | AdminComponentTypeSpecification;

export function filterTypeSpecifications(schema: Schema, filter: TypeSelectionFilter): Item[] {
  const items: Item[] = [];
  if (filter.showEntityTypes) {
    items.push(...filterItems(schema.spec.entityTypes, filter.entityTypes));
  }
  if (filter.showComponentTypes) {
    items.push(...filterItems(schema.spec.componentTypes, filter.componentTypes));
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
