#!/usr/bin/env node
import { AdminSchema } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

async function generateTypes(schemaSpec, filename) {
  const adminSchema = AdminSchema.createAndValidate(schemaSpec).valueOrThrow();
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ adminSchema, publishedSchema });
  await writeFile(filename, sourceCode);

  execFileSync('npx', ['prettier', '-w', filename]);
}

const schemaSpec = JSON.parse(await readFile('data/schema.json', 'utf8'));
await generateTypes(schemaSpec, './utils/SchemaTypes.ts');
