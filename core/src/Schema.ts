import type { Context } from '.';

export async function getSchema(context: Context<unknown>): Promise<Schema> {
  return new Schema({
    types: {
      BlogPost: { fields: [{ name: 'title', type: EntityFieldType.String, isName: true }] },
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
  types: Record<string, EntityTypeSpecification>;
}

export class Schema {
  constructor(readonly spec: SchemaSpecification) {}

  getEntityTypeSpecification(type: string): EntityTypeSpecification | null {
    return this.spec.types[type] ?? null;
  }
}
