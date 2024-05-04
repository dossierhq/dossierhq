import { BaseSchema } from './BaseSchema.js';
import { type PublishedSchemaSpecification } from './SchemaSpecification.js';

export class PublishedSchema extends BaseSchema<PublishedSchemaSpecification> {
  constructor(spec: PublishedSchemaSpecification) {
    super(spec);
  }
}
