import type { ValueItem } from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';
import { Column, Text } from '@jonasb/datadata-design';
import React, { Fragment, useContext } from 'react';
import { PublishedDataDataContext } from '../../published/index.js';
import type { FieldDisplayProps } from './FieldDisplay';
import { FieldDisplay } from './FieldDisplay';

type Props = FieldDisplayProps<ValueItem>;

export function ValueTypeFieldDisplay({ value }: Props) {
  const { schema } = useContext(PublishedDataDataContext);

  if (!schema || !value) {
    return null;
  }

  const { type } = value;
  const valueSpec = schema.getValueTypeSpecification(type);
  if (!valueSpec) {
    return <div>Error</div>;
  }

  return (
    <Column gap={1}>
      <Text textStyle="body2" noBottomMargin>
        {type}
      </Text>
      {valueSpec.fields.map((valueFieldSpec) => {
        const fieldDisplay = (
          <FieldDisplay fieldSpec={valueFieldSpec} value={value[valueFieldSpec.name]} />
        );
        return (
          <Fragment key={valueFieldSpec.name}>
            <Text textStyle="subtitle1" noBottomMargin>
              {valueFieldSpec.name}
            </Text>
            {valueFieldSpec.type === FieldType.ValueType ? (
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
