import {
  AdminClientOperationName,
  AdminEntityStatus,
  AdminSchema,
  isRichTextElementNode,
  notOk,
  ok,
  traverseEntity,
  type AdminClient,
  type AdminClientMiddleware,
  type AdminClientOperation,
  type AdminEntity,
  type AdminEntityInfo,
  type AdminSchemaSpecification,
  type EntityReference,
  type ErrorType,
  type JsonSyncEvent,
  type Logger,
  type OkFromResult,
  type PromiseResult,
  type RichTextElementNode,
  type SyncEvent,
} from '@dossierhq/core';
import type { Server, SessionContext } from '@dossierhq/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export function createFilesystemAdminMiddleware(
  server: Server,
  backChannelAdminClient: AdminClient,
  dataDir: string,
): AdminClientMiddleware<SessionContext> {
  return async (context: SessionContext, operation: AdminClientOperation) => {
    const result = await operation.next();
    if (result.isOk()) {
      try {
        switch (operation.name) {
          case AdminClientOperationName.createEntity: {
            const payload = result.value as OkFromResult<ReturnType<AdminClient['createEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity, dataDir);
            break;
          }
          case AdminClientOperationName.updateEntity: {
            const payload = result.value as OkFromResult<ReturnType<AdminClient['updateEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity, dataDir);
            break;
          }
          case AdminClientOperationName.updateSchemaSpecification: {
            const payload = result.value as OkFromResult<
              ReturnType<AdminClient['updateSchemaSpecification']>
            >;
            await updateSchemaSpecification(payload.schemaSpecification, dataDir);
            break;
          }
          case AdminClientOperationName.upsertEntity: {
            const payload = result.value as OkFromResult<ReturnType<AdminClient['upsertEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity, dataDir);
            break;
          }
        }
        if (operation.modifies) {
          await updateSyncEventsOnDisk(server, dataDir);
        }
      } catch (error) {
        operation.resolve(notOk.GenericUnexpectedException(context, error));
        return;
      }
    }
    operation.resolve(result);
  };
}

async function updateSchemaSpecification(
  schemaSpecification: AdminSchemaSpecification,
  dataDir: string,
) {
  const { version, ...schemaSpecificationWithoutVersion } = schemaSpecification;

  const schemaSpecificationPath = path.join(dataDir, 'schema.json');
  const schemaSpecificationJson = JSON.stringify(schemaSpecificationWithoutVersion, null, 2) + '\n';
  await fs.writeFile(schemaSpecificationPath, schemaSpecificationJson);
}

async function updateEntityFile(
  backChannelAdminClient: AdminClient,
  entity: AdminEntity<string, object>,
  dataDir: string,
) {
  const adminSchema = new AdminSchema(
    (await backChannelAdminClient.getSchemaSpecification()).valueOrThrow(),
  );

  const save = createCleanedUpEntity(adminSchema, entity);

  const directory = path.join(dataDir, 'entities', entity.info.type);
  const jsonFilePath = path.join(directory, `${entity.id}.json`);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(jsonFilePath, JSON.stringify(save, null, 2) + '\n');
}

function createCleanedUpEntity(adminSchema: AdminSchema, entity: AdminEntity<string, object>) {
  const copy = structuredClone(entity);

  // Remove unnecessary fields
  delete (copy.info as Partial<AdminEntityInfo>).createdAt;
  delete (copy.info as Partial<AdminEntityInfo>).updatedAt;
  delete (copy.info as Partial<AdminEntityInfo>).version;

  for (const node of traverseEntity(adminSchema, [], copy as AdminEntity)) {
    switch (node.type) {
      case 'richTextNode': {
        const richTextNode = node.node;
        if (isRichTextElementNode(richTextNode)) {
          // Move children entry to last to make it easier to read nested rich text
          const children = richTextNode.children;
          delete (richTextNode as Partial<RichTextElementNode>).children;
          richTextNode.children = children;
        }
        break;
      }
    }
  }

  return copy;
}

export async function loadAllEntities(
  adminClient: AdminClient,
  logger: Logger,
  dataDir: string,
): PromiseResult<EntityReference[], ErrorType> {
  const loadedEntries: EntityReference[] = [];

  const directoriesToLoad = [path.join(dataDir, 'entities')];
  const entitiesToRetry: { entryPath: string }[] = [];

  // Step 1: Traverse directories and attempt to load all entities (can fail on references)
  while (directoriesToLoad.length > 0) {
    const directory = directoriesToLoad.shift()!;
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        directoriesToLoad.push(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const createResult = await loadEntity(adminClient, logger, entryPath);
        if (createResult.isError()) {
          entitiesToRetry.push({ entryPath });
        } else {
          loadedEntries.push({ id: createResult.value.entity.id });
        }
      }
    }
  }

  // Step 2: Retry loading entities that failed in step 1
  let retryOneMoreRound = true;
  while (retryOneMoreRound) {
    retryOneMoreRound = false;
    const entitiesToRetryThisRound = entitiesToRetry.splice(0);

    logger.info(`Retrying loading ${entitiesToRetryThisRound.length} entities`);
    for (const { entryPath } of entitiesToRetryThisRound) {
      const createResult = await loadEntity(adminClient, logger, entryPath);
      if (createResult.isError()) {
        entitiesToRetry.push({ entryPath });
      } else {
        loadedEntries.push({ id: createResult.value.entity.id });
        retryOneMoreRound = true;
      }
    }
  }

  // Step 3: Show the errors for entities that failed to load
  if (entitiesToRetry.length > 0) {
    const entitiesToRetryThisRound = entitiesToRetry.splice(0);
    logger.info(`Retrying loading ${entitiesToRetryThisRound.length} entities to show errors`);

    for (const { entryPath } of entitiesToRetryThisRound) {
      const createResult = await loadEntity(adminClient, logger, entryPath);
      if (createResult.isError()) {
        logger.error('Error loading entity: %s: %s', createResult.error, createResult.message);
        entitiesToRetry.push({ entryPath });
      }
    }

    return notOk.Generic(`Failed to load ${entitiesToRetry.length} entities`);
  }

  return ok(loadedEntries);
}

async function loadEntity(adminClient: AdminClient, logger: Logger, entityPath: string) {
  logger.info('Upsert entity: %s', entityPath);
  const data = await fs.readFile(entityPath, { encoding: 'utf-8' });
  const entity = JSON.parse(data);
  if (![AdminEntityStatus.draft, AdminEntityStatus.published].includes(entity.info.status)) {
    throw new Error(
      `Entity ${entity.id} has unsupported status ${entity.info.status}, need to add support for this`,
    );
  }
  const publish = entity.info.status === 'published';
  const createResult = await adminClient.upsertEntity(entity, { publish });
  if (createResult.isOk()) {
    logger.info('  Effect: %s', createResult.value.effect);
  }
  return createResult;
}

export async function updateSyncEventsOnDisk(server: Server, dataDir: string): Promise<void> {
  const existingSyncEvents = await getCurrentSyncEventFiles(dataDir);

  let after: string | null = null;
  let nextIndex = 1;
  if (existingSyncEvents.length > 0) {
    const lastEventFile = existingSyncEvents[existingSyncEvents.length - 1];
    const lastEvent = JSON.parse(
      await fs.readFile(lastEventFile.path, { encoding: 'utf-8' }),
    ) as JsonSyncEvent;
    after = lastEvent.id;
    nextIndex = lastEventFile.index + 1;
  }

  while (true) {
    const eventsResult = await server.getSyncEvents({ after, limit: 10 });
    const { events, hasMore } = eventsResult.valueOrThrow();

    for (const event of events) {
      await storeEvent(nextIndex++, event, dataDir);
    }
    if (!hasMore) {
      break;
    }
    after = events[events.length - 1].id;
  }
}

export async function getCurrentSyncEventFiles(dataDir: string) {
  const syncEventsDir = path.join(dataDir, 'events');
  const filenames = await fs.readdir(syncEventsDir, { encoding: 'utf8' });
  const files = filenames
    .filter((it) => it.endsWith('.json'))
    .map((filename) => {
      const [indexString, _type, id, ..._rest] = filename.replace('.json', '').split('_');
      const index = Number(indexString);
      if (Number.isNaN(index) || !id) {
        throw new Error(`Failed to parse index and id from filename: ${filename}`);
      }
      return { path: path.join(syncEventsDir, filename), index, id };
    });
  files.sort((a, b) => {
    if (a.index === b.index) {
      throw new Error(`Duplicate index: ${a.index} (${a.path}, ${b.path})`);
    }
    return a.index - b.index;
  });
  return files;
}

async function storeEvent(index: number, event: SyncEvent, dataDir: string) {
  const { type } = event;

  const paddedIndex = index.toString().padStart(4, '0');
  const filename = path.join(dataDir, 'events', `${paddedIndex}_${type}_${event.id}.json`);
  const json = JSON.stringify(event, null, 2) + '\n';
  await fs.writeFile(filename, json, { encoding: 'utf8' });
}
