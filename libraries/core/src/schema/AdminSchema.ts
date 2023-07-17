import { ok, type ErrorType, type Result } from '../ErrorResult.js';
import { BaseSchema } from './BaseSchema.js';
import { PublishedSchema } from './PublishedSchema.js';
import type {
  AdminSchemaSpecification,
  AdminSchemaSpecificationUpdate,
  AdminSchemaSpecificationWithMigrations,
} from './SchemaSpecification.js';
import { schemaAdminToPublished } from './schemaAdminToPublished.js';
import { schemaUpdate } from './schemaUpdate.js';
import { schemaValidateAdmin } from './schemaValidateAdmin.js';

export class AdminSchema<
  TSpec extends
    | AdminSchemaSpecification
    | AdminSchemaSpecificationWithMigrations = AdminSchemaSpecification,
> extends BaseSchema<TSpec> {
  private cachedPublishedSchema: PublishedSchema | null = null;

  static createAndValidate(
    update: AdminSchemaSpecificationUpdate,
  ): Result<AdminSchema, typeof ErrorType.BadRequest> {
    const result = AdminSchemaWithMigrations.createAndValidate(update);
    if (!result.isOk()) return result;

    const { migrations, ...specWithoutMigrations } = result.value.spec;

    return ok(new AdminSchema(specWithoutMigrations));
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

export class AdminSchemaWithMigrations extends AdminSchema<AdminSchemaSpecificationWithMigrations> {
  static override createAndValidate(
    update: AdminSchemaSpecificationUpdate,
  ): Result<AdminSchemaWithMigrations, typeof ErrorType.BadRequest> {
    const emptySpec: AdminSchemaSpecificationWithMigrations = {
      version: 0,
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
      migrations: [],
    };
    const empty = new AdminSchemaWithMigrations(emptySpec);
    return empty.updateAndValidate(update);
  }

  updateAndValidate(
    update: AdminSchemaSpecificationUpdate,
  ): Result<AdminSchemaWithMigrations, typeof ErrorType.BadRequest> {
    // Update
    const updatedResult = schemaUpdate(this, update);
    if (updatedResult.isError()) return updatedResult;
    const updatedSpec = updatedResult.value;

    if (updatedSpec === this.spec) {
      return ok(this); // no change
    }

    // Validate
    const updatedSchema = new AdminSchemaWithMigrations(updatedSpec);
    const validateResult = updatedSchema.validate();
    if (validateResult.isError()) return validateResult;

    return ok(updatedSchema);
  }
}
