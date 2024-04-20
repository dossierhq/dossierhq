#!/usr/bin/env -S npx tsx
import { Schema, createConsoleLogger, type Logger } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { writeFile } from 'node:fs/promises';
import { initialize } from './backend/server.js';

async function generateTypes(logger: Logger, adminSchema: Schema, filename: string) {
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ adminSchema, publishedSchema });
  await writeFile(filename, sourceCode);
  logger.info(`Wrote ${filename}`);
}

async function getAdminSchema(server: Server) {
  const initSession = server.createSession({ provider: 'sys', identifier: 'init' });
  const adminClient = server.createAdminClient(() => initSession);
  const schemaResult = await adminClient.getSchemaSpecification();
  return new Schema(schemaResult.valueOrThrow());
}

async function main() {
  const logger = createConsoleLogger(console);
  const { server } = (await initialize(logger)).valueOrThrow();

  const adminSchema = await getAdminSchema(server);

  await generateTypes(logger, adminSchema, './src/SchemaTypes.ts');
  await server.shutdown();
}

await main();
