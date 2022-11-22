import type { BooleanFieldSpecification } from '@jonasb/datadata-core';
import { Checkbox, Delete, HoverRevealContainer } from '@jonasb/datadata-design';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<BooleanFieldSpecification, boolean>;

export function BooleanFieldEditor({ value, onChange }: Props) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked);
    },
    [onChange]
  );
  const handleClear = useCallback(() => onChange(null), [onChange]);

  return (
    <HoverRevealContainer>
      <HoverRevealContainer.Item flexGrow={1} forceVisible>
        <Checkbox checked={!!value} onChange={handleChange}>
          {value === true ? 'True' : value === false ? 'False' : <i>Not set</i>}
        </Checkbox>
      </HoverRevealContainer.Item>
      <HoverRevealContainer.Item>
        <Delete onClick={handleClear} />
      </HoverRevealContainer.Item>
    </HoverRevealContainer>
  );
}
