export interface EntityTypeSpecification {
  // TODO reserved or should there be a `graphqlName` when there is an issue?
  /** PascalCase. Reserved names: Node, Entity, EntityType, Query */
  name: string;
  fields: EntityFieldSpecification[];
}

export interface EntityFieldSpecification {
  name: string;
  type: EntityFieldType;
  isName?: boolean;
  /** Applicable for Reference and ReferenceSet */
  entityTypes?: string[];
}

export enum EntityFieldType {
  BasicString = 'String',
  Reference = 'Reference',
  ReferenceSet = 'ReferenceSet',
}

const specifications: EntityTypeSpecification[] = [];

specifications.push(
  {
    name: 'BlogPost',
    fields: [
      { name: 'title', type: EntityFieldType.BasicString, isName: true },
      { name: 'summary', type: EntityFieldType.BasicString },
    ],
  },
  {
    name: 'PlaceOfBusiness',
    fields: [
      { name: 'name', type: EntityFieldType.BasicString, isName: true },
      { name: 'address1', type: EntityFieldType.BasicString },
      { name: 'address2', type: EntityFieldType.BasicString },
      { name: 'city', type: EntityFieldType.BasicString },
      { name: 'zip', type: EntityFieldType.BasicString },
      { name: 'phone', type: EntityFieldType.BasicString },
      { name: 'email', type: EntityFieldType.BasicString },
      { name: 'facebook', type: EntityFieldType.BasicString },
      { name: 'instagram', type: EntityFieldType.BasicString },
      { name: 'web', type: EntityFieldType.BasicString },
      {
        name: 'owner',
        type: EntityFieldType.Reference,
        entityTypes: ['Organization'],
      },
    ],
  },
  {
    name: 'Organization',
    fields: [
      { name: 'name', type: EntityFieldType.BasicString, isName: true },
      { name: 'organizationNumber', type: EntityFieldType.BasicString },
      { name: 'address1', type: EntityFieldType.BasicString },
      { name: 'address2', type: EntityFieldType.BasicString },
      { name: 'city', type: EntityFieldType.BasicString },
      { name: 'zip', type: EntityFieldType.BasicString },
      { name: 'web', type: EntityFieldType.BasicString },
    ],
  }
);

export function getAllEntitySpecifications() {
  return specifications;
}

export function getEntityTypeSpecification(
  type: string
): EntityTypeSpecification {
  const result = specifications.find((x) => x.name === type);
  if (!result) {
    throw new Error(`Entity type (${type}) doesn't exist`);
  }
  return result;
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
