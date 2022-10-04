import type { ValueItem } from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';
import { Column, Text } from '@jonasb/datadata-design';
import { Fragment, useContext } from 'react';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import type { FieldDisplayProps } from './FieldDisplay.js';
import { FieldDisplay } from './FieldDisplay.js';

interface Props extends FieldDisplayProps<ValueItem> {
  className?: string;
}

export function ValueTypeFieldDisplay({ className, value }: Props) {
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
    <Column className={className} gap={1}>
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
