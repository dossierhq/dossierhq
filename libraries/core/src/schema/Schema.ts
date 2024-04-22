import { ok, type ErrorType, type Result } from '../ErrorResult.js';
import { BaseSchema } from './BaseSchema.js';
import { PublishedSchema } from './PublishedSchema.js';
import type {
  SchemaMigrationAction,
  SchemaSpecification,
  SchemaSpecificationUpdate,
  SchemaSpecificationWithMigrations,
} from './SchemaSpecification.js';
import { schemaToPublished } from './schemaToPublished.js';
import { schemaUpdate } from './schemaUpdate.js';
import { schemaValidate } from './schemaValidate.js';

export class Schema<
  TSpec extends SchemaSpecification | SchemaSpecificationWithMigrations = SchemaSpecification,
> extends BaseSchema<TSpec> {
  private cachedPublishedSchema: PublishedSchema | null = null;

  static createAndValidate(
    update: SchemaSpecificationUpdate,
  ): Result<Schema, typeof ErrorType.BadRequest> {
    const result = SchemaWithMigrations.createAndValidate(update);
    if (!result.isOk()) return result;

    const { migrations, ...specWithoutMigrations } = result.value.spec;

    return ok(new Schema(specWithoutMigrations));
  }

  constructor(spec: TSpec) {
    super(spec);
  }

  validate(): Result<void, typeof ErrorType.BadRequest> {
    return schemaValidate(this);
  }

  toPublishedSchema(): PublishedSchema {
    if (this.cachedPublishedSchema) {
      return this.cachedPublishedSchema;
    }

    const publishedSpec = schemaToPublished(this);

    this.cachedPublishedSchema = new PublishedSchema(publishedSpec);
    return this.cachedPublishedSchema;
  }
}

export class SchemaWithMigrations extends Schema<SchemaSpecificationWithMigrations> {
  static override createAndValidate(
    update: SchemaSpecificationUpdate,
  ): Result<SchemaWithMigrations, typeof ErrorType.BadRequest> {
    const emptySpec: SchemaSpecificationWithMigrations = {
      schemaKind: 'full',
      version: 0,
      entityTypes: [],
      componentTypes: [],
      patterns: [],
      indexes: [],
      migrations: [],
    };
    const empty = new SchemaWithMigrations(emptySpec);
    return empty.updateAndValidate(update);
  }

  updateAndValidate(
    update: SchemaSpecificationUpdate,
  ): Result<SchemaWithMigrations, typeof ErrorType.BadRequest> {
    // Update
    const updatedResult = schemaUpdate(this.spec, update);
    if (updatedResult.isError()) return updatedResult;
    const updatedSpec = updatedResult.value;

    if (updatedSpec === this.spec) {
      return ok(this); // no change
    }

    // Validate
    const updatedSchema = new SchemaWithMigrations(updatedSpec);
    const validateResult = updatedSchema.validate();
    if (validateResult.isError()) return validateResult;

    return ok(updatedSchema);
  }

  collectMigrationActionsSinceVersion(oldSchemaVersion: number): SchemaMigrationAction[] {
    const migrationsToConsider = this.spec.migrations.filter((it) => it.version > oldSchemaVersion);
    if (migrationsToConsider.length === 0) {
      return [];
    }

    migrationsToConsider.sort((a, b) => a.version - b.version);

    const actions = [];
    for (const migration of migrationsToConsider) {
      actions.push(...migration.actions);
    }
    return actions;
  }
}
