#!/usr/bin/env -S npx ts-node-esm
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { IntegrationTestSchema } from '../src/IntegrationTestSchema.js';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const adminSchema = AdminSchema.createAndValidate(schemaSpec).valueOrThrow();
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ adminSchema, publishedSchema });

  await writeFile(filename, sourceCode, { encoding: 'utf8' });
  execFileSync('npx', ['prettier', '-w', filename]);
}

await generateTypes(IntegrationTestSchema, './src/SchemaTypes.ts');
