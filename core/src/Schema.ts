import type { EntityReference, Result, ErrorType, Location, RichText, Value } from '.';
import { notOk, ok } from '.';

export interface EntityTypeSpecification {
  name: string;
  fields: FieldSpecification[];
}

export interface ValueTypeSpecification {
  name: string;
  fields: FieldSpecification[];
}

export enum FieldType {
  EntityType = 'EntityType',
  Location = 'Location',
  RichText = 'RichText',
  String = 'String',
  ValueType = 'ValueType',
}

export interface FieldSpecification {
  name: string;
  type: FieldType;
  list?: boolean;
  isName?: boolean;
  /** Applicable when type is EntityType */
  entityTypes?: string[];
  /** Applicable when type is ValueType */
  valueTypes?: string[];
}

export interface FieldValueTypeMap {
  [FieldType.EntityType]: EntityReference;
  [FieldType.Location]: Location;
  [FieldType.RichText]: RichText;
  [FieldType.String]: string;
  [FieldType.ValueType]: Value;
}

export interface SchemaSpecification {
  entityTypes: EntityTypeSpecification[];
  valueTypes: ValueTypeSpecification[];
}

export class Schema {
  readonly spec: SchemaSpecification;

  constructor(spec: SchemaSpecification) {
    this.spec = spec;
  }

  validate(): Result<void, ErrorType.BadRequest> {
    const usedNames = new Set();
    for (const typeSpec of [...this.spec.entityTypes, ...this.spec.valueTypes]) {
      if (usedNames.has(typeSpec.name)) {
        return notOk.BadRequest(`${typeSpec.name}: Duplicate type name`);
      }
      usedNames.add(typeSpec.name);

      for (const fieldSpec of typeSpec.fields) {
        if (!(fieldSpec.type in FieldType)) {
          return notOk.BadRequest(
            `${typeSpec.name}.${fieldSpec.name}: Specified type ${fieldSpec.type} doesn’t exist`
          );
        }

        if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
          if (fieldSpec.type !== FieldType.EntityType) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify entityTypes`
            );
          }
          for (const referencedTypeName of fieldSpec.entityTypes) {
            if (this.spec.entityTypes.findIndex((x) => x.name === referencedTypeName) < 0) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Referenced entity type in entityTypes ${referencedTypeName} doesn’t exist`
              );
            }
          }
        }

        if (fieldSpec.valueTypes && fieldSpec.valueTypes.length > 0) {
          if (fieldSpec.type !== FieldType.ValueType) {
            return notOk.BadRequest(
              `${typeSpec.name}.${fieldSpec.name}: Field with type ${fieldSpec.type} shouldn’t specify valueTypes`
            );
          }
          for (const referencedTypeName of fieldSpec.valueTypes) {
            if (this.spec.valueTypes.findIndex((x) => x.name === referencedTypeName) < 0) {
              return notOk.BadRequest(
                `${typeSpec.name}.${fieldSpec.name}: Value type in valueTypes ${referencedTypeName} doesn’t exist`
              );
            }
          }
        }
      }
    }

    return ok(undefined);
  }

  getEntityTypeCount(): number {
    return this.spec.entityTypes.length;
  }

  getEntityTypeSpecification(type: string): EntityTypeSpecification | null {
    return this.spec.entityTypes.find((x) => x.name === type) ?? null;
  }

  getEntityFieldSpecification(
    entitySpec: EntityTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return entitySpec.fields.find((x) => x.name === fieldName) ?? null;
  }

  getValueTypeCount(): number {
    return this.spec.valueTypes.length;
  }

  getValueTypeSpecification(type: string): ValueTypeSpecification | null {
    return this.spec.valueTypes.find((x) => x.name === type) ?? null;
  }

  getValueFieldSpecification(
    valueSpec: ValueTypeSpecification,
    fieldName: string
  ): FieldSpecification | null {
    return valueSpec.fields.find((x) => x.name === fieldName) ?? null;
  }
}
