import {
  FieldType,
  type Component,
  type ComponentFieldSpecification,
  type FieldSpecification,
} from '@dossierhq/core';
import { Fragment } from 'react';
import { useDisplaySchema } from '../hooks/useDisplaySchema.js';
import { FieldDisplay, type FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<ComponentFieldSpecification, Component>;

export function ComponentFieldDisplay({ id, value }: Props) {
  const { schema } = useDisplaySchema();

  if (!schema || !value) {
    return null;
  }

  const { type } = value;
  const componentSpec = schema.getComponentTypeSpecification(type);
  if (!componentSpec) {
    return <div>Error: no such component type “{type}”</div>;
  }

  return (
    <div id={id}>
      <p className="text-muted-foreground text-sm">{type}</p>
      <div className="flex flex-col gap-1 border-l-2 pl-3">
        {componentSpec.fields.map((componentFieldSpec) => {
          const fieldDisplay = (
            <FieldDisplay
              fieldSpec={componentFieldSpec as FieldSpecification}
              value={value[componentFieldSpec.name]}
            />
          );
          return (
            <Fragment key={componentFieldSpec.name}>
              <p className="text-sm font-medium">{componentFieldSpec.name}</p>
              {componentFieldSpec.type === FieldType.Component ? (
                <div className="pl-3">{fieldDisplay}</div>
              ) : (
                fieldDisplay
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
