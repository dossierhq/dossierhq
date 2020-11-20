import type { Context, PromiseResult, Result, SessionContext } from '.';
import { notOk, ok, ErrorType } from '.';
import * as Db from './Db';
import type { EntityTypesTable } from './DbTableTypes';

export async function getSchema(context: Context<unknown>): Promise<Schema> {
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

export enum EntityFieldType {
  Reference = 'Reference',
  String = 'String',
}

export interface EntityFieldSpecification {
  name: string;
  type: EntityFieldType;
  isName?: boolean;
  /** Applicable for Reference */
  entityTypes?: string[];
}

export interface EntityFieldValueTypeMap {
  [EntityFieldType.Reference]: { id: string } | null;
  [EntityFieldType.String]: string | null;
}

export function isReferenceFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown
): value is EntityFieldValueTypeMap[EntityFieldType.Reference] {
  return fieldSpec.type === EntityFieldType.Reference;
}

export function isStringFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown
): value is EntityFieldValueTypeMap[EntityFieldType.String] {
  return fieldSpec.type === EntityFieldType.String;
}

export interface SchemaSpecification {
  entityTypes: Record<string, EntityTypeSpecification>;
}

export class Schema {
  constructor(readonly spec: SchemaSpecification) {}

  validate(): Result<void, ErrorType.BadRequest> {
    for (const [name, entitySpec] of Object.entries(this.spec.entityTypes)) {
      for (const fieldSpec of entitySpec.fields) {
        if (!(fieldSpec.type in EntityFieldType)) {
          return notOk.BadRequest(
            `${name}.${fieldSpec.name}: Specified type ${fieldSpec.type} doesn’t exist`
          );
        }

        if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
          if (fieldSpec.type !== EntityFieldType.Reference) {
            return notOk.BadRequest(
              `${name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify entityTypes`
            );
          }
          for (const referencedTypeName of fieldSpec.entityTypes) {
            if (!(referencedTypeName in this.spec.entityTypes)) {
              return notOk.BadRequest(
                `${name}.${fieldSpec.name}: Referenced entity type in entityTypes ${referencedTypeName} doesn’t exist`
              );
            }
          }
        }
      }
    }

    return ok(undefined);
  }

  getEntityTypeCount(): number {
    return Object.keys(this.spec.entityTypes).length;
  }

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
