import {
  isFieldValueEqual,
  notOk,
  ok,
  type AdminEntityTypeSpecification,
  type AdminSchemaWithMigrations,
  type AdminValueTypeSpecification,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import type { DatabaseManagementMarkEntitiesDirtySelectorArg } from '@dossierhq/database-adapter';

export function calculateSchemaChangeImpact(
  previous: AdminSchemaWithMigrations,
  next: AdminSchemaWithMigrations,
): Result<
  {
    deleteEntityTypes: string[];
    renameEntityTypes: Record<string, string>;
    renameValueTypes: Record<string, string>;
    dirtyEntitiesSelector: DatabaseManagementMarkEntitiesDirtySelectorArg | null;
    deleteValueTypes: string[];
  },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const validateEntityTypes = new Set<string>();
  const indexEntityTypes = new Set<string>();
  const validateValueTypes = new Set<string>();
  const indexValueTypes = new Set<string>();
  const deleteEntityTypes: string[] = [];
  const renameEntityTypes: Record<string, string> = {};
  const deleteValueTypes: string[] = [];
  const renameValueTypes: Record<string, string> = {};

  const migrationActions = next.collectMigrationActionsSinceVersion(previous.spec.version);

  for (const isEntityType of [true, false]) {
    const previousTypes = isEntityType ? previous.spec.entityTypes : previous.spec.valueTypes;
    const validateTypes = isEntityType ? validateEntityTypes : validateValueTypes;
    const indexTypes = isEntityType ? indexEntityTypes : indexValueTypes;

    for (const previousType of previousTypes) {
      // Apply migrations on type
      let nextTypeName: string | null = previousType.name;
      for (const actionSpec of migrationActions) {
        if (
          isEntityType
            ? 'entityType' in actionSpec && actionSpec.entityType === nextTypeName
            : 'valueType' in actionSpec && actionSpec.valueType === nextTypeName
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
          : next.getValueTypeSpecification(nextTypeName)
        : null;

      // type is deleted
      if (!nextType) {
        validateTypes.add(previousType.name);
        indexTypes.add(previousType.name);
        if (isEntityType) {
          deleteEntityTypes.push(previousType.name);
        } else {
          deleteValueTypes.push(previousType.name);
        }
        continue;
      }

      if (previousType.name !== nextType.name) {
        // type is renamed
        if (isEntityType) {
          renameEntityTypes[previousType.name] = nextType.name;
        } else {
          renameValueTypes[previousType.name] = nextType.name;
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
        const indexTypes = isEntityType ? indexEntityTypes : indexValueTypes;
        const typeName = isEntityType ? actionSpec.entityType : actionSpec.valueType;
        indexTypes.add(typeName);
        break;
      }
    }
  }

  let dirtyEntitiesSelector = null;
  if (
    validateEntityTypes.size !== 0 ||
    indexEntityTypes.size !== 0 ||
    validateValueTypes.size !== 0 ||
    indexValueTypes.size !== 0
  ) {
    dirtyEntitiesSelector = {
      validateEntityTypes: [...validateEntityTypes],
      validateValueTypes: [...validateValueTypes],
      indexEntityTypes: [...indexEntityTypes],
      indexValueTypes: [...indexValueTypes],
    };
  }

  return ok({
    deleteEntityTypes,
    renameEntityTypes,
    renameValueTypes,
    dirtyEntitiesSelector,
    deleteValueTypes,
  });
}

function calculateTypeSelector(
  isEntityType: boolean,
  previous: AdminSchemaWithMigrations,
  previousType: AdminEntityTypeSpecification | AdminValueTypeSpecification,
  next: AdminSchemaWithMigrations,
  nextType: AdminEntityTypeSpecification | AdminValueTypeSpecification,
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
      (previousType as AdminEntityTypeSpecification).authKeyPattern,
      next,
      (nextType as AdminEntityTypeSpecification).authKeyPattern,
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
  previous: AdminSchemaWithMigrations,
  previousPatternName: string | null,
  next: AdminSchemaWithMigrations,
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
