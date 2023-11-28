#!/usr/bin/env -S npx tsx
import {
  AdminSchemaWithMigrations,
  createConsoleLogger,
  type AdminClient,
  type Logger,
} from '@dossierhq/core';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { writeFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { getAuthenticatedAdminClient, getServer } from '../src/dossier/utils/ServerUtils.js';

async function generateTypes(
  logger: Logger,
  adminSchema: AdminSchemaWithMigrations,
  filename: string,
) {
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({
    adminSchema,
    publishedSchema,
    authKeyType: "'none' | 'subject'",
  });

  const prettierConfig = await resolveConfig(filename);
  const formattedSource = await format(sourceCode, {
    ...prettierConfig,
    filepath: filename,
  });

  await writeFile(filename, formattedSource);
  logger.info(`Wrote ${filename}`);
}

async function getAdminSchema(logger: Logger, adminClient: AdminClient) {
  const schemaResult = await adminClient.getSchemaSpecification({ includeMigrations: true });
  let adminSchema = new AdminSchemaWithMigrations(schemaResult.valueOrThrow());

  if (adminSchema.getEntityTypeCount() === 0) {
    logger.info('No entities found, adding placeholder with name "Placeholder"');
    adminSchema = adminSchema
      .updateAndValidate({ entityTypes: [{ name: 'Placeholder', fields: [] }] })
      .valueOrThrow();
  }

  return adminSchema;
}

async function main() {
  const logger = createConsoleLogger(console);
  const server = (await getServer()).valueOrThrow();
  const adminClient = (await getAuthenticatedAdminClient('editor')).valueOrThrow();
  const adminSchema = await getAdminSchema(logger, adminClient);

  await generateTypes(logger, adminSchema, './src/generated/SchemaTypes.ts');

  await server.shutdown();
}

await main();
