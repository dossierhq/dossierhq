import {
  DossierClientOperationName,
  Schema,
  isRichTextElementNode,
  notOk,
  traverseEntity,
  type DossierClient,
  type DossierClientMiddleware,
  type DossierClientOperation,
  type Entity,
  type EntityInfo,
  type SchemaSpecification,
  type JsonSyncEvent,
  type OkFromResult,
  type RichTextElementNode,
  type SyncEvent,
} from '@dossierhq/core';
import type { Server, SessionContext } from '@dossierhq/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export function createFilesystemAdminMiddleware(
  server: Server,
  backChannelAdminClient: DossierClient,
  dataDir: string,
): DossierClientMiddleware<SessionContext> {
  return async (context: SessionContext, operation: DossierClientOperation) => {
    const result = await operation.next();
    if (result.isOk()) {
      try {
        switch (operation.name) {
          case DossierClientOperationName.createEntity: {
            const payload = result.value as OkFromResult<ReturnType<DossierClient['createEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity, dataDir);
            break;
          }
          case DossierClientOperationName.updateEntity: {
            const payload = result.value as OkFromResult<ReturnType<DossierClient['updateEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity, dataDir);
            break;
          }
          case DossierClientOperationName.updateSchemaSpecification: {
            const payload = result.value as OkFromResult<
              ReturnType<DossierClient['updateSchemaSpecification']>
            >;
            await updateSchemaSpecification(payload.schemaSpecification, dataDir);
            break;
          }
          case DossierClientOperationName.upsertEntity: {
            const payload = result.value as OkFromResult<ReturnType<DossierClient['upsertEntity']>>;
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
  schemaSpecification: SchemaSpecification,
  dataDir: string,
) {
  const { version, ...schemaSpecificationWithoutVersion } = schemaSpecification;

  const schemaSpecificationPath = path.join(dataDir, 'schema.json');
  const schemaSpecificationJson = JSON.stringify(schemaSpecificationWithoutVersion, null, 2) + '\n';
  await fs.writeFile(schemaSpecificationPath, schemaSpecificationJson);
}

async function updateEntityFile(
  backChannelAdminClient: DossierClient,
  entity: Entity<string, object>,
  dataDir: string,
) {
  const schema = new Schema((await backChannelAdminClient.getSchemaSpecification()).valueOrThrow());

  const save = createCleanedUpEntity(schema, entity);

  const directory = path.join(dataDir, 'entities', entity.info.type);
  const jsonFilePath = path.join(directory, `${entity.id}.json`);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(jsonFilePath, JSON.stringify(save, null, 2) + '\n');
}

function createCleanedUpEntity(schema: Schema, entity: Entity<string, object>) {
  const copy = structuredClone(entity);

  // Remove unnecessary fields
  delete (copy.info as Partial<EntityInfo>).createdAt;
  delete (copy.info as Partial<EntityInfo>).updatedAt;
  delete (copy.info as Partial<EntityInfo>).version;

  for (const node of traverseEntity(schema, [], copy as Entity)) {
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
