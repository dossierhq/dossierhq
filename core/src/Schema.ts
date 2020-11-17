import type { SessionContext } from '.';
import * as Db from './Db';
import type { EntityTypesTable } from './DbTableTypes';
import { ErrorType, ok, PromiseResult } from './ErrorResult';

export async function getSchema(context: SessionContext): Promise<Schema> {
  const entityTypes: SchemaSpecification['entityTypes'] = {};

  const entitySpecs = await Db.queryMany<Pick<EntityTypesTable, 'name' | 'specification'>>(
    context,
    'SELECT name, specification FROM entity_types'
  );
  for (const { name, specification } of entitySpecs) {
    entityTypes[name] = specification;
  }

  return new Schema({
    entityTypes,
  });
}

export async function setSchema(
  context: SessionContext,
  schema: Schema
): PromiseResult<void, ErrorType.BadRequest> {
  return await context.withTransaction(async (context) => {
    for (const [name, entitySpec] of Object.entries(schema.spec.entityTypes)) {
      await Db.queryNone(
        context,
        `INSERT INTO entity_types(name, specification) VALUES ($1, $2)
          ON CONFLICT (name) DO UPDATE SET specification = EXCLUDED.specification`,
        [name, entitySpec]
      );
      // TODO remove entity types not included?
    }

    return ok(undefined);
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
