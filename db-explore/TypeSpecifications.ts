export interface EntityTypeSpecification {
  name: string;
  fields: EntityFieldSpecification[];
}

export interface EntityFieldSpecification {
  name: string;
  type: EntityFieldType;
}

export enum EntityFieldType {
  BasicString = 'string',
}

const specifications: EntityTypeSpecification[] = [];

specifications.push({
  name: 'blog-post',
  fields: [{ name: 'title', type: EntityFieldType.BasicString }],
});

export function getEntityTypeSpecification(
  type: string
): EntityTypeSpecification | null {
  return specifications.find((x) => x.name === type) ?? null;
}

export function getEntityFieldSpecification(
  typeSpec: EntityTypeSpecification,
  fieldName: string
): EntityFieldSpecification {
  const result = typeSpec.fields.find((x) => x.name === fieldName);
  if (!result) {
    throw new Error(`Type (${typeSpec.name}) contains no field (${fieldName})`);
  }
  return result;
}
