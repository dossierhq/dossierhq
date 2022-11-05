#!/usr/bin/env -S bun
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { readFile, writeFile } from 'node:fs/promises';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const adminSchema = AdminSchema.createAndValidate(schemaSpec).valueOrThrow();
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ adminSchema: null, publishedSchema });
  await writeFile(filename, sourceCode);

  await Bun.spawn({ cmd: ['npx', 'prettier', '-w', filename] }).exited;
}

const schemaSpec = JSON.parse(await readFile('data/schema.json', 'utf8'));
await generateTypes(schemaSpec, './utils/SchemaTypes.ts');
