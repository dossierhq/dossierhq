#!/usr/bin/env -S npx ts-node-esm
import { AdminSchema, createConsoleLogger, type Logger } from '@dossierhq/core';
import { type Server } from '@dossierhq/server';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { writeFile } from 'node:fs/promises';
import { initialize } from './backend/server.js';

async function generateTypes(logger: Logger, adminSchema: AdminSchema, filename: string) {
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({
    adminSchema,
    publishedSchema,
    authKeyType: "'none' | 'subject'",
  });
  await writeFile(filename, sourceCode);
  logger.info(`Wrote ${filename}`);
}

async function getAdminSchema(server: Server) {
  const initSession = server.createSession({
    provider: 'sys',
    identifier: 'init',
    defaultAuthKeys: [],
    logger: null,
    databasePerformance: null,
  });
  const adminClient = server.createAdminClient(() => initSession);
  const schemaResult = await adminClient.getSchemaSpecification();
  return new AdminSchema(schemaResult.valueOrThrow());
}

async function main() {
  const logger = createConsoleLogger(console);
  const { server } = (await initialize(logger)).valueOrThrow();

  const adminSchema = await getAdminSchema(server);

  await generateTypes(logger, adminSchema, './src/SchemaTypes.ts');
  await server.shutdown();
}

await main();
