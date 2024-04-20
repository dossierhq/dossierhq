import { ok, type ErrorType, type Result } from '../ErrorResult.js';
import { BaseSchema } from './BaseSchema.js';
import { PublishedSchema } from './PublishedSchema.js';
import type {
  AdminSchemaMigrationAction,
  AdminSchemaSpecification,
  AdminSchemaSpecificationUpdate,
  AdminSchemaSpecificationWithMigrations,
} from './SchemaSpecification.js';
import { schemaAdminToPublished } from './schemaAdminToPublished.js';
import { schemaUpdate } from './schemaUpdate.js';
import { schemaValidateAdmin } from './schemaValidateAdmin.js';

export class Schema<
  TSpec extends
    | AdminSchemaSpecification
    | AdminSchemaSpecificationWithMigrations = AdminSchemaSpecification,
> extends BaseSchema<TSpec> {
  private cachedPublishedSchema: PublishedSchema | null = null;

  static createAndValidate(
    update: AdminSchemaSpecificationUpdate,
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
    return schemaValidateAdmin(this);
  }

  toPublishedSchema(): PublishedSchema {
    if (this.cachedPublishedSchema) {
      return this.cachedPublishedSchema;
    }

    const publishedSpec = schemaAdminToPublished(this);

    this.cachedPublishedSchema = new PublishedSchema(publishedSpec);
    return this.cachedPublishedSchema;
  }
}

export class SchemaWithMigrations extends Schema<AdminSchemaSpecificationWithMigrations> {
  static override createAndValidate(
    update: AdminSchemaSpecificationUpdate,
  ): Result<SchemaWithMigrations, typeof ErrorType.BadRequest> {
    const emptySpec: AdminSchemaSpecificationWithMigrations = {
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
    update: AdminSchemaSpecificationUpdate,
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

  collectMigrationActionsSinceVersion(oldSchemaVersion: number): AdminSchemaMigrationAction[] {
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
