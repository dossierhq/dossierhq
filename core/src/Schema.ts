import type { Context, PromiseResult, Result, SessionContext } from '.';
import { notOk, ok, ErrorType } from '.';
import * as Db from './Db';
import type { SchemaVersionsTable } from './DbTableTypes';

export async function getSchema(context: Context<unknown>): Promise<Schema> {
  const { specification } = await Db.queryOne<Pick<SchemaVersionsTable, 'specification'>>(
    context,
    'SELECT specification FROM schema_versions ORDER BY id DESC LIMIT 1'
  );

  return new Schema(specification);
}

export async function setSchema(
  context: SessionContext,
  schema: Schema
): PromiseResult<void, ErrorType.BadRequest> {
  const validation = schema.validate();
  if (validation.isError()) {
    return validation;
  }
  // TODO check if different
  await Db.queryNone(context, 'INSERT INTO schema_versions (specification) VALUES ($1)', [
    schema.spec,
  ]);
  return ok(undefined);
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
  list?: boolean;
  isName?: boolean;
  /** Applicable for Reference */
  entityTypes?: string[];
}

export interface EntityFieldValueTypeMap {
  [EntityFieldType.Reference]: { id: string };
  [EntityFieldType.String]: string;
}

export function isReferenceFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown | null
): value is EntityFieldValueTypeMap[EntityFieldType.Reference] | null {
  return fieldSpec.type === EntityFieldType.Reference && !fieldSpec.list;
}

export function isReferenceListFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown | null
): value is Array<EntityFieldValueTypeMap[EntityFieldType.Reference]> | null {
  return fieldSpec.type === EntityFieldType.Reference && !!fieldSpec.list;
}

export function isStringFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown | null
): value is EntityFieldValueTypeMap[EntityFieldType.String] | null {
  return fieldSpec.type === EntityFieldType.String && !fieldSpec.list;
}

export function isStringListFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown | null
): value is Array<EntityFieldValueTypeMap[EntityFieldType.String]> | null {
  return fieldSpec.type === EntityFieldType.String && !!fieldSpec.list;
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
