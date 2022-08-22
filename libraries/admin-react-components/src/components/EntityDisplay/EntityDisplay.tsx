import type {
  AdminFieldSpecification,
  PublishedEntity,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { Field } from '@jonasb/datadata-design';
import { FieldDisplay } from './FieldDisplay.js';

interface Props {
  entity: PublishedEntity;
  schema: PublishedSchema;
}

export function EntityDisplay({ entity, schema }: Props) {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);

  if (!entitySpec) return null;

  return (
    <>
      {entitySpec.fields.map((fieldSpec) => (
        <EntityFieldDisplay
          key={fieldSpec.name}
          value={entity.fields[fieldSpec.name]}
          fieldSpec={fieldSpec}
        />
      ))}
    </>
  );
}

function EntityFieldDisplay({
  value,
  fieldSpec,
}: {
  value: unknown;
  fieldSpec: AdminFieldSpecification;
}) {
  return (
    <Field>
      <Field.Label>{fieldSpec.name}</Field.Label>
      <Field.Control>
        <FieldDisplay value={value} fieldSpec={fieldSpec} />
      </Field.Control>
    </Field>
  );
}
