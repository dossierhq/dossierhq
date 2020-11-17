import type { Context } from '.';

export async function getSchema(context: Context<unknown>): Promise<Schema> {
  return new Schema({
    entityTypes: {
      BlogPost: {
        fields: [
          { name: 'title', type: EntityFieldType.String, isName: true },
          { name: 'summary', type: EntityFieldType.String },
        ],
      },
      Category: { fields: [{ name: 'title', type: EntityFieldType.String }] },
    },
  });
}

export interface EntityTypeSpecification {
  fields: EntityFieldSpecification[];
}

export interface EntityFieldSpecification {
  name: string;
  type: EntityFieldType;
  isName?: boolean;
}

export enum EntityFieldType {
  String = 'String',
}

export interface SchemaSpecification {
  entityTypes: Record<string, EntityTypeSpecification>;
}

export class Schema {
  constructor(readonly spec: SchemaSpecification) {}

  getEntityTypeSpecification(type: string): EntityTypeSpecification | null {
    return this.spec.entityTypes[type] ?? null;
  }

  getEntityFieldSpecification(
    entitySpec: EntityTypeSpecification,
    fieldName: string
  ): EntityFieldSpecification | null {
    return entitySpec.fields.find((x) => x.name === fieldName) ?? null;
  }
}
