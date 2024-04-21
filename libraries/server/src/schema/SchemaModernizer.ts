import {
  FieldType,
  RichTextNodeType,
  type ComponentTypeSpecification,
  type EntityTypeSpecification,
  type FieldSpecification,
  type SchemaMigrationAction,
  type SchemaSpecificationWithMigrations,
  type ComponentFieldSpecification,
  type LegacyComponentTypeSpecification,
  type LegacyEntityTypeSpecification,
  type LegacySchemaSpecificationWithMigrations,
  type RichTextFieldSpecification,
} from '@dossierhq/core';

export function modernizeSchemaSpecification(
  specification: SchemaSpecificationWithMigrations | LegacySchemaSpecificationWithMigrations,
): SchemaSpecificationWithMigrations {
  const payload: SchemaSpecificationWithMigrations = {
    schemaKind: 'full',
    version: specification.version,
    entityTypes: specification.entityTypes.map(modernizeEntityType),
    componentTypes: [],
    patterns: specification.patterns ?? [],
    indexes: specification.indexes ?? [],
    migrations:
      specification.migrations?.map((it) => ({
        ...it,
        actions: it.actions.map(modernizeMigrationAction),
      })) ?? [],
  };

  // Version 0.5: renamed valueTypes to componentTypes
  if ('componentTypes' in specification) {
    payload.componentTypes = specification.componentTypes.map(modernizeComponentType);
  } else {
    payload.componentTypes = specification.valueTypes.map(modernizeComponentType);
  }

  return payload;
}

type EntityTypeSpec = EntityTypeSpecification | LegacyEntityTypeSpecification;
type ComponentTypeSpec = ComponentTypeSpecification | LegacyComponentTypeSpecification;
type FieldSpec = FieldSpecification | EntityTypeSpec['fields'][number];
type ActionSpec =
  | SchemaMigrationAction
  | LegacySchemaSpecificationWithMigrations['migrations'][number]['actions'][number];

function modernizeEntityType(typeSpec: EntityTypeSpec): EntityTypeSpecification {
  // Version 0.2.3: moved isName from field to nameField on entity types, isName is deprecated
  if (typeSpec.nameField === undefined) {
    typeSpec.nameField =
      typeSpec.fields.find((it) => (it as { isName?: boolean }).isName)?.name ?? null;
    for (const fieldSpec of typeSpec.fields) {
      delete (fieldSpec as { isName?: boolean }).isName;
    }
  }

  typeSpec.fields = typeSpec.fields.map(modernizeField);
  return typeSpec as EntityTypeSpecification;
}

function modernizeComponentType(typeSpec: ComponentTypeSpec): ComponentTypeSpecification {
  typeSpec.fields = typeSpec.fields.map(modernizeField);
  return typeSpec as ComponentTypeSpecification;
}

function modernizeField(fieldSpec: FieldSpec): FieldSpecification {
  // Version 0.2.3: moved isName from field to nameField on entity types, isName is deprecated
  delete (fieldSpec as { isName?: boolean }).isName;
  // Field types were renamed
  if ((fieldSpec.type as string) === 'EntityType') fieldSpec.type = FieldType.Reference;
  if ((fieldSpec.type as string) === 'ValueType') fieldSpec.type = FieldType.Component;
  // Version 0.5: renamed ValueItem to Component
  if ((fieldSpec.type as string) === 'ValueItem') fieldSpec.type = FieldType.Component;
  // Version 0.7: renamed Entity to Reference
  if ((fieldSpec.type as string) === 'Entity') fieldSpec.type = FieldType.Reference;

  if (fieldSpec.type === FieldType.Component) {
    // Version 0.5: renamed valueTypes to componentTypes
    if ('valueTypes' in fieldSpec) {
      (fieldSpec as ComponentFieldSpecification).componentTypes = fieldSpec.valueTypes as string[];
      delete fieldSpec.valueTypes;
    }
  } else if (fieldSpec.type === FieldType.String) {
    // Version 0.2.15: added values to string fields
    if (fieldSpec.values === undefined) fieldSpec.values = [];
  } else if (fieldSpec.type === FieldType.RichText) {
    // Version 0.3.2: added tab as required node
    if (
      fieldSpec.richTextNodes.length > 0 &&
      !fieldSpec.richTextNodes.includes(RichTextNodeType.tab)
    ) {
      fieldSpec.richTextNodes.push('tab');
      fieldSpec.richTextNodes.sort();
    }
    // Version 0.5: renamed valueItem to component
    const valueItemIndex = fieldSpec.richTextNodes.indexOf('valueItem');
    if (valueItemIndex >= 0) {
      fieldSpec.richTextNodes[valueItemIndex] = 'component';
      fieldSpec.richTextNodes.sort();
    }
    // Version 0.5: renamed valueTypes to componentTypes
    if ('valueTypes' in fieldSpec) {
      (fieldSpec as unknown as RichTextFieldSpecification).componentTypes = fieldSpec.valueTypes;
      delete (fieldSpec as { valueTypes?: string[] }).valueTypes;
    }
  }

  return fieldSpec as FieldSpecification;
}

function modernizeMigrationAction(action: ActionSpec): SchemaMigrationAction {
  if ('valueType' in action) {
    (action as unknown as { componentType: string }).componentType = action.valueType;
    delete (action as { valueType?: string }).valueType;
  }
  return action as SchemaMigrationAction;
}
