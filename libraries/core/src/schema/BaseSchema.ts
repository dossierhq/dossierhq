import type {
  ComponentTypeSpecification,
  FieldSpecification,
  PublishedSchemaSpecification,
  SchemaIndexSpecification,
  SchemaPatternSpecification,
  SchemaSpecification,
  SchemaSpecificationWithMigrations,
} from './SchemaSpecification.js';

export class BaseSchema<
  T extends SchemaSpecification | SchemaSpecificationWithMigrations | PublishedSchemaSpecification,
> {
  readonly spec: T;
  private cachedPatternRegExps: Record<string, RegExp> = {};

  constructor(spec: T) {
    this.spec = spec;
  }

  getEntityTypeCount(): number {
    return this.spec.entityTypes.length;
  }

  getEntityTypeSpecification(type: string): T['entityTypes'][number] | null {
    return this.spec.entityTypes.find((it) => it.name === type) ?? null;
  }

  getEntityFieldSpecification(
    entitySpec: T['entityTypes'][number],
    fieldName: string,
  ): T['entityTypes'][number]['fields'][number] | null {
    return entitySpec.fields.find((it) => it.name === fieldName) ?? null;
  }

  getComponentTypeCount(): number {
    return this.spec.componentTypes.length;
  }

  getComponentTypeSpecification(type: string): T['componentTypes'][number] | null {
    return this.spec.componentTypes.find((it) => it.name === type) ?? null;
  }

  getComponentFieldSpecification(
    componentSpec: ComponentTypeSpecification,
    fieldName: string,
  ): FieldSpecification | null {
    return componentSpec.fields.find((it) => it.name === fieldName) ?? null;
  }

  getPattern(name: string): SchemaPatternSpecification | null {
    return this.spec.patterns.find((it) => it.name === name) ?? null;
  }

  getPatternRegExp(name: string): RegExp | null {
    let regexp = this.cachedPatternRegExps[name];
    if (regexp) return regexp;

    const pattern = this.getPattern(name);
    if (!pattern) return null;

    regexp = new RegExp(pattern.pattern);
    this.cachedPatternRegExps[name] = regexp;
    return regexp;
  }

  getIndex(name: string): SchemaIndexSpecification | null {
    return this.spec.indexes.find((it) => it.name === name) ?? null;
  }
}
