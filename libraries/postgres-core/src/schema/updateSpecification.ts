import {
  notOk,
  ok,
  type AdminSchemaSpecification,
  type ErrorType,
  type PromiseResult,
  type UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import {
  DEFAULT,
  buildPostgresSqlQuery,
  type Session,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { UniqueConstraints, type SchemaVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';
import { createUpdateSchemaEvent } from '../utils/EventUtils.js';

export async function schemaUpdateSpecification(
  adapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  session: Session,
  schemaSpec: AdminSchemaSpecification,
  syncEvent: UpdateSchemaSyncEvent | null,
): PromiseResult<void, typeof ErrorType.Conflict | typeof ErrorType.Generic> {
  const { version, ...schemaSpecWithoutVersion } = schemaSpec;
  const createVersionResult = await queryOne<
    Pick<SchemaVersionsTable, 'id'>,
    typeof ErrorType.Conflict
  >(
    adapter,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      const updatedAt = syncEvent?.createdAt ?? DEFAULT;
      sql`INSERT INTO schema_versions (version, specification, updated_at)`;
      sql`VALUES (${version}, ${schemaSpecWithoutVersion}, ${updatedAt}) RETURNING id`;
    }),
    (error) => {
      if (
        adapter.isUniqueViolationOfConstraint(error, UniqueConstraints.schema_versions_version_key)
      ) {
        return notOk.Conflict(`Schema version ${version} already exists`);
      }
      return notOk.GenericUnexpectedException(context, error);
    },
  );
  if (createVersionResult.isError()) return createVersionResult;
  const { id: schemaVersionId } = createVersionResult.value;

  const createEventResult = await createUpdateSchemaEvent(
    adapter,
    context,
    session,
    schemaVersionId,
    syncEvent,
  );
  if (createEventResult.isError()) return createEventResult;

  return ok(undefined);
}
