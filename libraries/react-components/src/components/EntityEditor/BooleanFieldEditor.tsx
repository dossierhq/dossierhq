import type { BooleanFieldSpecification } from '@dossierhq/core';
import {
  Button,
  Checkbox,
  Delete,
  HoverRevealContainer,
  Text,
  toFlexItemClassName,
} from '@dossierhq/design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<BooleanFieldSpecification, boolean>;

export function BooleanFieldEditor({ value, validationIssues, dragHandle, onChange }: Props) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked);
    },
    [onChange],
  );
  const handleClear = useCallback(() => onChange(null), [onChange]);

  return (
    <HoverRevealContainer>
      <HoverRevealContainer.Item flexGrow={1} forceVisible>
        {dragHandle}
        <Checkbox checked={!!value} onChange={handleChange}>
          {value === true ? 'True' : value === false ? 'False' : <i>Not set</i>}
        </Checkbox>
        {validationIssues.map((error, index) => (
          <Text key={index} textStyle="body2" marginTop={1} color="danger">
            {error.message}
          </Text>
        ))}
      </HoverRevealContainer.Item>
      <HoverRevealContainer.Item>
        <Delete onClick={handleClear} />
      </HoverRevealContainer.Item>
    </HoverRevealContainer>
  );
}

export function AddBooleanListItemButton({
  onAddItem,
}: {
  onAddItem: (value: boolean | null) => void;
}) {
  return (
    <Button
      className={toFlexItemClassName({ alignSelf: 'flex-start' })}
      onClick={() => onAddItem(null)}
    >
      Add
    </Button>
  );
}
