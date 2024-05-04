#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { Schema } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import prettier from 'prettier';

async function generateTypes(schemaSpec, filename) {
  const schema = Schema.createAndValidate(schemaSpec).valueOrThrow();
  const publishedSchema = schema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ schema, publishedSchema });

  const prettierConfig = await prettier.resolveConfig(filename);
  const formattedSource = await prettier.format(sourceCode, {
    ...prettierConfig,
    filepath: filename,
  });

  await writeFile(filename, formattedSource, { encoding: 'utf8' });
}

const schemaSpec = JSON.parse(await readFile('data/schema.json', 'utf8'));
await generateTypes(schemaSpec, './utils/SchemaTypes.ts');
