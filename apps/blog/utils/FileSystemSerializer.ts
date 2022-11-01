import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  AdminEntity,
  AdminEntityInfo,
  OkFromResult,
  RichTextElementNode,
} from '@jonasb/datadata-core';
import {
  AdminClientOperationName,
  AdminSchema,
  isRichTextElementNode,
  notOk,
  traverseEntity,
} from '@jonasb/datadata-core';
import type { SessionContext } from '@jonasb/datadata-server';
import fs from 'node:fs/promises';
import path from 'node:path';

export function createFilesystemAdminMiddleware(
  backChannelAdminClient: AdminClient
): AdminClientMiddleware<SessionContext> {
  return async (context: SessionContext, operation: AdminClientOperation) => {
    const result = await operation.next();
    if (result.isOk()) {
      try {
        switch (operation.name) {
          case AdminClientOperationName.createEntity: {
            const payload = result.value as OkFromResult<ReturnType<AdminClient['createEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity);
            break;
          }
          case AdminClientOperationName.updateEntity: {
            const payload = result.value as OkFromResult<ReturnType<AdminClient['updateEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity);
            break;
          }
          case AdminClientOperationName.upsertEntity: {
            const payload = result.value as OkFromResult<ReturnType<AdminClient['upsertEntity']>>;
            await updateEntityFile(backChannelAdminClient, payload.entity);
            break;
          }
        }
      } catch (error) {
        operation.resolve(notOk.GenericUnexpectedException(context, error));
        return;
      }
    }
    operation.resolve(result);
  };
}

async function updateEntityFile(
  backChannelAdminClient: AdminClient,
  entity: AdminEntity<string, object>
) {
  const adminSchema = new AdminSchema(
    (await backChannelAdminClient.getSchemaSpecification()).valueOrThrow()
  );

  const save = createCleanedUpEntity(adminSchema, entity);

  const directory = path.join('data', 'entities', entity.info.type);
  const jsonFilePath = path.join(directory, `${entity.id}.json`);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(jsonFilePath, JSON.stringify(save, null, 2));
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
