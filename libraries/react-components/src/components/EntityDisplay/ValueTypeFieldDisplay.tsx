import {
  FieldType,
  type Component,
  type ComponentFieldSpecification,
  type RichTextFieldSpecification,
} from '@dossierhq/core';
import { Column, Text } from '@dossierhq/design';
import { Fragment, useContext } from 'react';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import type { FieldDisplayProps } from './FieldDisplay.js';
import { FieldDisplay } from './FieldDisplay.js';

interface Props
  extends FieldDisplayProps<ComponentFieldSpecification | RichTextFieldSpecification, Component> {
  className?: string;
}

export function ValueTypeFieldDisplay({ className, value }: Props) {
  const { schema } = useContext(PublishedDossierContext);

  if (!schema || !value) {
    return null;
  }

  const { type } = value;
  const valueSpec = schema.getComponentTypeSpecification(type);
  if (!valueSpec) {
    return <div>Error</div>;
  }

  return (
    <Column className={className} gap={1}>
      <Text textStyle="body2" marginBottom={0}>
        {type}
      </Text>
      {valueSpec.fields.map((valueFieldSpec) => {
        const fieldDisplay = (
          <FieldDisplay fieldSpec={valueFieldSpec} value={value[valueFieldSpec.name]} />
        );
        return (
          <Fragment key={valueFieldSpec.name}>
            <Text textStyle="subtitle1" marginBottom={0}>
              {valueFieldSpec.name}
            </Text>
            {valueFieldSpec.type === FieldType.Component ? (
              <div className="nested-value-item-indentation">{fieldDisplay}</div>
            ) : (
              fieldDisplay
            )}
          </Fragment>
        );
      })}
    </Column>
  );
}
