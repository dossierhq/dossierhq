import { type PublishedSchemaSpecification } from './SchemaSpecification.js';
import { BaseSchema } from './BaseSchema.js';

export class PublishedSchema extends BaseSchema<PublishedSchemaSpecification> {
  constructor(spec: PublishedSchemaSpecification) {
    super(spec);
  }
}
