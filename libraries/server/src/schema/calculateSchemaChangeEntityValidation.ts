import {
  assertExhaustive,
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

export function calculateSchemaChangeEntityValidation(
  previous: AdminSchemaWithMigrations,
  next: AdminSchemaWithMigrations,
): Result<
  DatabaseManagementMarkEntitiesDirtySelectorArg | null,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const validateEntityTypes: string[] = [];
  const indexEntityTypes: string[] = [];
  const validateValueTypes: string[] = [];
  const indexValueTypes: string[] = [];

  for (const isEntityType of [true, false]) {
    const previousTypes = isEntityType ? previous.spec.entityTypes : previous.spec.valueTypes;
    for (const previousType of previousTypes) {
      const nextType = isEntityType
        ? next.getEntityTypeSpecification(previousType.name)
        : next.getValueTypeSpecification(previousType.name);
      if (!nextType) {
        return notOk.BadRequest(`Type ${previousType.name} was removed`);
      }

      const validationResult = hasTypeChanged(isEntityType, previous, previousType, next, nextType);
      if (validationResult.isError()) return validationResult;

      if (validationResult.value) {
        const validateTypes = isEntityType ? validateEntityTypes : validateValueTypes;
        validateTypes.push(previousType.name);
      }
    }
  }

  const migrationActions = next.collectMigrationActionsSinceVersion(previous.spec.version);
  for (const actionSpec of migrationActions) {
    const action = actionSpec.action;
    switch (action) {
      case 'deleteField': {
        const isEntityType = 'entityType' in actionSpec;
        const indexTypes = isEntityType ? indexEntityTypes : indexValueTypes;
        const typeName = isEntityType ? actionSpec.entityType : actionSpec.valueType;
        indexTypes.push(typeName);
        break;
      }
      case 'renameField':
        break;
      case 'deleteType':
        //TODO support delete type
        break;
      case 'renameType':
        //TODO support rename type
        break;
      default:
        assertExhaustive(action);
    }
  }

  if (
    validateEntityTypes.length === 0 &&
    indexEntityTypes.length === 0 &&
    validateValueTypes.length === 0 &&
    indexValueTypes.length === 0
  ) {
    return ok(null);
  }

  return ok({ validateEntityTypes, validateValueTypes, indexEntityTypes, indexValueTypes });
}

function hasTypeChanged(
  isEntityType: boolean,
  previous: AdminSchemaWithMigrations,
  previousType: AdminEntityTypeSpecification | AdminValueTypeSpecification,
  next: AdminSchemaWithMigrations,
  nextType: AdminEntityTypeSpecification | AdminValueTypeSpecification,
): Result<boolean, typeof ErrorType.Generic> {
  if (!isFieldValueEqual(previousType.fields, nextType.fields)) {
    // TODO not all field changes require validation
    return ok(true);
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
      return ok(true);
    }
  }

  for (const previousFieldSpec of previousType.fields) {
    const nextFieldSpec = nextType.fields.find((it) => it.name === previousFieldSpec.name);
    if (!nextFieldSpec) continue;

    if ('matchPattern' in previousFieldSpec) {
      const patternResult = validateDueToPatternChange(
        previous,
        previousFieldSpec.matchPattern,
        next,
        'matchPattern' in nextFieldSpec ? nextFieldSpec.matchPattern : null,
      );
      if (patternResult.isError()) return patternResult;
      if (patternResult.value) {
        return ok(true);
      }
    }
  }

  return ok(false);
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
