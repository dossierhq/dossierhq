#!/usr/bin/env -S bun
import { Schema, type SchemaSpecificationUpdate } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { writeFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { IntegrationTestSchema } from '../src/IntegrationTestSchema.js';

async function generateTypes(schemaSpec: SchemaSpecificationUpdate, filename: string) {
  const schema = Schema.createAndValidate(schemaSpec).valueOrThrow();
  const publishedSchema = schema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({
    schema,
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
