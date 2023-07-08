#!/usr/bin/env -S npx ts-node-esm
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { writeFile } from 'node:fs/promises';
import prettier from 'prettier';
import { IntegrationTestSchema } from '../src/IntegrationTestSchema.js';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const adminSchema = AdminSchema.createAndValidate(schemaSpec).valueOrThrow();
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ adminSchema, publishedSchema });

  const prettierConfig = await prettier.resolveConfig(filename);
  const formattedSource = await prettier.format(sourceCode, {
    ...prettierConfig,
    filepath: filename,
  });

  await writeFile(filename, formattedSource, { encoding: 'utf8' });
}

await generateTypes(IntegrationTestSchema, './src/SchemaTypes.ts');
