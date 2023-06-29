import type { AdminFieldSpecification, StringFieldSpecification } from '@dossierhq/core';
import {
  Button,
  ButtonDropdown,
  Input,
  SelectDisplay,
  Text,
  TextArea,
  toFlexItemClassName,
} from '@dossierhq/design';
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

export function AddStringListItemButton({
  fieldSpec,
  onChange,
  value,
}: {
  fieldSpec: AdminFieldSpecification<StringFieldSpecification>;
  onChange: (value: (string | null)[]) => void;
  value: (string | null)[] | null;
}) {
  if (fieldSpec.values.length > 0) {
    return (
      <ButtonDropdown
        className={toFlexItemClassName({ alignSelf: 'flex-start' })}
        items={fieldSpec.values.map((item) => ({ id: item.value }))}
        renderItem={(item) => item.id}
        onItemClick={(item) => onChange(value ? [...value, item.id] : [item.id])}
      >
        Add
      </ButtonDropdown>
    );
  }

  return (
    <Button
      className={toFlexItemClassName({ alignSelf: 'flex-start' })}
      onClick={() => onChange(value ? [...value, null] : [null])}
    >
      Add
    </Button>
  );
}
