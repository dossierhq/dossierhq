import {
  isFieldValueEqual,
  notOk,
  ok,
  type AdminEntityTypeSpecification,
  type AdminSchema,
  type AdminValueTypeSpecification,
  type ErrorType,
  type Result,
} from '@dossierhq/core';

export function calculateSchemaChangeRevalidation(
  previous: AdminSchema,
  next: AdminSchema
): Result<
  { entityTypes: string[]; valueTypes: string[] },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const entityTypes: string[] = [];
  const valueTypes: string[] = [];
  for (const isEntityType of [true, false]) {
    const previousTypes = isEntityType ? previous.spec.entityTypes : previous.spec.valueTypes;
    for (const previousType of previousTypes) {
      const nextType = isEntityType
        ? next.getEntityTypeSpecification(previousType.name)
        : next.getValueTypeSpecification(previousType.name);
      if (!nextType) {
        return notOk.BadRequest(`Type ${previousType.name} was removed`);
      }

      const revalidateResult = hasTypeChanged(isEntityType, previous, previousType, next, nextType);
      if (revalidateResult.isError()) return revalidateResult;

      if (revalidateResult.value) {
        if (isEntityType) {
          entityTypes.push(previousType.name);
        } else {
          valueTypes.push(previousType.name);
        }
      }
    }
  }

  return ok({ entityTypes, valueTypes });
}

function hasTypeChanged(
  isEntityType: boolean,
  previous: AdminSchema,
  previousType: AdminEntityTypeSpecification | AdminValueTypeSpecification,
  next: AdminSchema,
  nextType: AdminEntityTypeSpecification | AdminValueTypeSpecification
): Result<boolean, typeof ErrorType.Generic> {
  if (!isFieldValueEqual(previousType.fields, nextType.fields)) {
    // TODO not all field changes require revalidation
    return ok(true);
  }

  // authKeyPattern
  if (isEntityType) {
    const patternResult = revalidateDueToPatternChange(
      previous,
      (previousType as AdminEntityTypeSpecification).authKeyPattern,
      next,
      (nextType as AdminEntityTypeSpecification).authKeyPattern
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
      const patternResult = revalidateDueToPatternChange(
        previous,
        previousFieldSpec.matchPattern,
        next,
        'matchPattern' in nextFieldSpec ? nextFieldSpec.matchPattern : null
      );
      if (patternResult.isError()) return patternResult;
      if (patternResult.value) {
        return ok(true);
      }
    }
  }

  return ok(false);
}

function revalidateDueToPatternChange(
  previous: AdminSchema,
  previousPatternName: string | null,
  next: AdminSchema,
  nextPatternName: string | null
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
