#!/usr/bin/env -S npx tsx
import { writeFile } from 'node:fs/promises';
import { createConsoleLogger, Schema, type Logger } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { initialize } from './backend/server.js';

async function generateTypes(logger: Logger, schema: Schema, filename: string) {
  const publishedSchema = schema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ schema, publishedSchema });
  await writeFile(filename, sourceCode);
  logger.info(`Wrote ${filename}`);
}

async function getAdminSchema(server: Server) {
  const initSession = server.createSession({ provider: 'sys', identifier: 'init' });
  const client = server.createDossierClient(() => initSession);
  const schemaResult = await client.getSchemaSpecification();
  return new Schema(schemaResult.valueOrThrow());
}

async function main() {
  const logger = createConsoleLogger(console);
  const { server } = (await initialize(logger)).valueOrThrow();

  const schema = await getAdminSchema(server);

  await generateTypes(logger, schema, './src/SchemaTypes.ts');
  await server.shutdown();
}

await main();
