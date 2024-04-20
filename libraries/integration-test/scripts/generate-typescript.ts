#!/usr/bin/env -S bun
import { Schema, type AdminSchemaSpecificationUpdate } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { writeFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { IntegrationTestSchema } from '../src/IntegrationTestSchema.js';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const adminSchema = Schema.createAndValidate(schemaSpec).valueOrThrow();
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({
    adminSchema,
    publishedSchema,
    authKeyPatternTypeMap: { subjectOrDefault: "''|'subject'", subject: "'subject'" },
  });

  const prettierConfig = await resolveConfig(filename);
  const formattedSource = await format(sourceCode, {
    ...prettierConfig,
    filepath: filename,
  });

  await writeFile(filename, formattedSource, { encoding: 'utf8' });
}

await generateTypes(IntegrationTestSchema, './src/SchemaTypes.ts');
