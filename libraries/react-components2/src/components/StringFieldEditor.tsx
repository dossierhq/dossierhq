import type { StringFieldSpecification } from '@dossierhq/core';
import { useCallback, type ChangeEvent } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Textarea } from './ui/textarea.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

type Props = FieldEditorProps<StringFieldSpecification, string>;

export function StringFieldEditor(props: Props) {
  const {
    id,
    fieldSpec,
    value,
    validationIssues,
    // dragHandle,
    onChange,
  } = props;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  //TODO
  // if (fieldSpec.values.length > 0) {
  //   return <StringValueFieldEditor {...props} />;
  // }
  //
  return (
    <>
      {fieldSpec.multiline ? (
        <Textarea id={id} value={value ?? ''} onChange={handleChange} />
      ) : (
        <Input id={id} value={value ?? ''} onChange={handleChange} />
      )}
      <ValidationIssuesDisplay validationIssues={validationIssues} />
    </>
  );

  /*TODO
return (
  <>
    {fieldSpec.multiline ? (
      <>
        {dragHandle}
        <TextArea value={value ?? ''} onChange={handleChange} />
      </>
    ) : (
      <Row>
        {dragHandle}
        <Input
          className={toFlexItemClassName({ flexGrow: 1 })}
          value={value ?? ''}
          onChange={handleChange}
        />
      </Row>
    )}
    <ValidationIssuesDisplay validationIssues={validationIssues} />
  </>
);
*/
}

/*TODO
function StringValueFieldEditor({
fieldSpec,
value,
validationIssues,
dragHandle,
onChange,
}: Props) {
const handleItemClick = useCallback(
  (item: { id: string }) => {
    onChange(item.id);
  },
  [onChange],
);
const handleClear = useCallback(() => onChange(null), [onChange]);

return (
  <HoverRevealContainer>
    {dragHandle ? (
      <HoverRevealContainer.Item forceVisible alignSelf="center">
        {dragHandle}
      </HoverRevealContainer.Item>
    ) : null}
    <HoverRevealContainer.Item flexGrow={1} forceVisible>
      <ButtonDropdown
        items={fieldSpec.values.map((item) => ({ id: item.value }))}
        renderItem={(item) => item.id}
        onItemClick={handleItemClick}
      >
        {value ? value : <i>Not set</i>}
      </ButtonDropdown>
      <ValidationIssuesDisplay validationIssues={validationIssues} />
    </HoverRevealContainer.Item>
    <HoverRevealContainer.Item>
      <Delete onClick={handleClear} />
    </HoverRevealContainer.Item>
  </HoverRevealContainer>
);
}
*/
export function AddStringListItemButton({
  fieldSpec: _,
  onAddItem,
}: {
  fieldSpec: StringFieldSpecification;
  onAddItem: (value: string | null) => void;
}) {
  /*
  if (fieldSpec.values.length > 0) {
    return (
      <ButtonDropdown
        className={toFlexItemClassName({ alignSelf: 'flex-start' })}
        items={fieldSpec.values.map((item) => ({ id: item.value }))}
        renderItem={(item) => item.id}
        onItemClick={(item) => onAddItem(item.id)}
      >
        Add
      </ButtonDropdown>
    );
  }
  */

  return (
    <Button className="self-start" onClick={() => onAddItem(null)}>
      Add
    </Button>
  );
}
