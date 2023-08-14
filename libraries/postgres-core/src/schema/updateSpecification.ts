import {
  notOk,
  type AdminSchemaSpecification,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { Session, TransactionContext } from '@dossierhq/database-adapter';
import { UniqueConstraints } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';

export async function schemaUpdateSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  session: Session,
  schemaSpec: AdminSchemaSpecification,
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const { version, ...schemaSpecWithoutVersion } = schemaSpec;
  return await queryNone(
    adapter,
    context,
    {
      text: 'INSERT INTO schema_versions (version, specification) VALUES ($1, $2)',
      values: [version, schemaSpecWithoutVersion],
    },
    (error) => {
      if (
        adapter.isUniqueViolationOfConstraint(error, UniqueConstraints.schema_versions_version_key)
      ) {
        return notOk.Conflict(`Schema version ${version} already exists`);
      }
      return notOk.GenericUnexpectedException(context, error);
    },
  );
}
