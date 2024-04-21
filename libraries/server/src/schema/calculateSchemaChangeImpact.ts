import {
  isFieldValueEqual,
  notOk,
  ok,
  type ComponentTypeSpecification,
  type EntityTypeSpecification,
  type SchemaTransientMigrationAction,
  type SchemaWithMigrations,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import type { DatabaseManagementMarkEntitiesDirtySelectorArg } from '@dossierhq/database-adapter';

export function calculateSchemaChangeImpact(
  previous: SchemaWithMigrations,
  next: SchemaWithMigrations,
  transientMigrations: SchemaTransientMigrationAction[] | null,
): Result<
  {
    deleteEntityTypes: string[];
    renameEntityTypes: Record<string, string>;
    renameComponentTypes: Record<string, string>;
    deleteUniqueValueIndexes: string[];
    renameUniqueValueIndexes: Record<string, string>;
    dirtyEntitiesSelector: DatabaseManagementMarkEntitiesDirtySelectorArg | null;
    deleteComponentTypes: string[];
  },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const validateEntityTypes = new Set<string>();
  const indexEntityTypes = new Set<string>();
  const validateComponentTypes = new Set<string>();
  const indexComponentTypes = new Set<string>();
  const deleteEntityTypes: string[] = [];
  const renameEntityTypes: Record<string, string> = {};
  const deleteComponentTypes: string[] = [];
  const renameComponentTypes: Record<string, string> = {};
  const deleteUniqueValueIndexes: string[] = [];
  const renameUniqueValueIndexes: Record<string, string> = {};

  const migrationActions = next.collectMigrationActionsSinceVersion(previous.spec.version);

  for (const isEntityType of [true, false]) {
    const previousTypes = isEntityType ? previous.spec.entityTypes : previous.spec.componentTypes;
    const validateTypes = isEntityType ? validateEntityTypes : validateComponentTypes;
    const indexTypes = isEntityType ? indexEntityTypes : indexComponentTypes;

    for (const previousType of previousTypes) {
      // Apply migrations on type
      let nextTypeName: string | null = previousType.name;
      for (const actionSpec of migrationActions) {
        if (
          isEntityType
            ? 'entityType' in actionSpec && actionSpec.entityType === nextTypeName
            : 'componentType' in actionSpec && actionSpec.componentType === nextTypeName
        ) {
          if (actionSpec.action === 'renameType') {
            nextTypeName = actionSpec.newName;
          } else if (actionSpec.action === 'deleteType') {
            nextTypeName = null;
          }
        }
      }

      const nextType = nextTypeName
        ? isEntityType
          ? next.getEntityTypeSpecification(nextTypeName)
          : next.getComponentTypeSpecification(nextTypeName)
        : null;

      // type is deleted
      if (!nextType) {
        validateTypes.add(previousType.name);
        indexTypes.add(previousType.name);
        if (isEntityType) {
          deleteEntityTypes.push(previousType.name);
        } else {
          deleteComponentTypes.push(previousType.name);
        }
        continue;
      }

      if (previousType.name !== nextType.name) {
        // type is renamed
        if (isEntityType) {
          renameEntityTypes[previousType.name] = nextType.name;
        } else {
          renameComponentTypes[previousType.name] = nextType.name;
        }
      }

      const validationResult = calculateTypeSelector(
        isEntityType,
        previous,
        previousType,
        next,
        nextType,
      );
      if (validationResult.isError()) return validationResult;

      if (validationResult.value.validate) {
        validateTypes.add(nextType.name);
      }
      if (validationResult.value.index) {
        indexTypes.add(nextType.name);
      }
    }
  }

  for (const actionSpec of migrationActions) {
    const action = actionSpec.action;
    switch (action) {
      case 'deleteField': {
        const isEntityType = 'entityType' in actionSpec;
        const indexTypes = isEntityType ? indexEntityTypes : indexComponentTypes;
        const typeName = isEntityType ? actionSpec.entityType : actionSpec.componentType;
        indexTypes.add(typeName);
        break;
      }
    }
  }

  for (const actionSpec of transientMigrations ?? []) {
    const existingRename = Object.entries(renameUniqueValueIndexes).find(
      ([, newName]) => newName === actionSpec.index,
    );

    switch (actionSpec.action) {
      case 'deleteIndex':
        if (existingRename) {
          deleteUniqueValueIndexes.push(existingRename[0]);
          delete renameUniqueValueIndexes[existingRename[0]];
        } else {
          deleteUniqueValueIndexes.push(actionSpec.index);
        }
        break;
      case 'renameIndex': {
        if (existingRename) {
          renameUniqueValueIndexes[existingRename[0]] = actionSpec.newName;
        } else {
          renameUniqueValueIndexes[actionSpec.index] = actionSpec.newName;
        }
        break;
      }
    }
  }

  let dirtyEntitiesSelector = null;
  if (
    validateEntityTypes.size !== 0 ||
    indexEntityTypes.size !== 0 ||
    validateComponentTypes.size !== 0 ||
    indexComponentTypes.size !== 0
  ) {
    dirtyEntitiesSelector = {
      validateEntityTypes: [...validateEntityTypes],
      validateComponentTypes: [...validateComponentTypes],
      indexEntityTypes: [...indexEntityTypes],
      indexComponentTypes: [...indexComponentTypes],
    };
  }

  return ok({
    deleteEntityTypes,
    renameEntityTypes,
    renameComponentTypes,
    dirtyEntitiesSelector,
    deleteComponentTypes,
    deleteUniqueValueIndexes,
    renameUniqueValueIndexes,
  });
}

function calculateTypeSelector(
  isEntityType: boolean,
  previous: SchemaWithMigrations,
  previousType: EntityTypeSpecification | ComponentTypeSpecification,
  next: SchemaWithMigrations,
  nextType: EntityTypeSpecification | ComponentTypeSpecification,
): Result<{ validate: boolean; index: boolean }, typeof ErrorType.Generic> {
  let validate = false;
  let index = false;

  if (!isFieldValueEqual(previousType.fields, nextType.fields)) {
    // TODO not all field changes require validation
    validate = true;
  }

  if (!!previousType.adminOnly !== !!nextType.adminOnly) {
    validate = true;
    index = true;
  }

  // authKeyPattern
  if (isEntityType) {
    const patternResult = validateDueToPatternChange(
      previous,
      (previousType as EntityTypeSpecification).authKeyPattern,
      next,
      (nextType as EntityTypeSpecification).authKeyPattern,
    );
    if (patternResult.isError()) return patternResult;
    if (patternResult.value) {
      validate = true;
    }
  }

  for (const previousFieldSpec of previousType.fields) {
    const nextFieldSpec = nextType.fields.find((it) => it.name === previousFieldSpec.name);
    if (!nextFieldSpec) continue;

    if (!!previousFieldSpec.adminOnly !== !!nextFieldSpec.adminOnly) {
      index = true;
    }

    const previousIndex = 'index' in previousFieldSpec ? previousFieldSpec.index : null;
    const nextIndex = 'index' in nextFieldSpec ? nextFieldSpec.index : null;
    if (previousIndex !== nextIndex) {
      index = true;
    }

    if ('matchPattern' in previousFieldSpec) {
      const patternResult = validateDueToPatternChange(
        previous,
        previousFieldSpec.matchPattern,
        next,
        'matchPattern' in nextFieldSpec ? nextFieldSpec.matchPattern : null,
      );
      if (patternResult.isError()) return patternResult;
      if (patternResult.value) {
        validate = true;
      }
    }
  }

  return ok({ validate, index });
}

function validateDueToPatternChange(
  previous: SchemaWithMigrations,
  previousPatternName: string | null,
  next: SchemaWithMigrations,
  nextPatternName: string | null,
): Result<boolean, typeof ErrorType.Generic> {
  if (!previousPatternName && nextPatternName) {
    // added
    return ok(true);
  } else if (previousPatternName && nextPatternName) {
    // modified?
    const previousPattern = previous.getPattern(previousPatternName);
    const nextPattern = next.getPattern(nextPatternName);
    if (!previousPattern || !nextPattern) {
      return notOk.Generic('Pattern not found');
    }
    return ok(previousPattern.pattern !== nextPattern.pattern);
  }
  // removed
  return ok(false);
}
