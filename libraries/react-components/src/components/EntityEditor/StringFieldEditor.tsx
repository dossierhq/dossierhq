import type { StringFieldSpecification } from '@dossierhq/core';
import { Input, SelectDisplay, Text, TextArea } from '@dossierhq/design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<StringFieldSpecification, string>;

export function StringFieldEditor({ fieldSpec, value, validationIssues, onChange }: Props) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  if (fieldSpec.values.length > 0) {
    return (
      <span>
        <SelectDisplay value={value ?? ''} onChange={handleChange}>
          <SelectDisplay.Option value={''}>&nbsp;</SelectDisplay.Option>
          {fieldSpec.values.map((item, index) => (
            <SelectDisplay.Option key={index} value={item.value}>
              {item.value}
            </SelectDisplay.Option>
          ))}
        </SelectDisplay>
      </span>
    );
  }

  return (
    <>
      {fieldSpec.multiline ? (
        <TextArea value={value ?? ''} onChange={handleChange} />
      ) : (
        <Input value={value ?? ''} onChange={handleChange} />
      )}
      {validationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}
