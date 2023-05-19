import { Button, Column, Tag, Text } from '@dossierhq/design';

interface Props {
  readOnly?: boolean;
  value: { value: string }[];
  onChange: (value: { value: string }[]) => void;
}

export function ValuesEditor({ readOnly, value, onChange }: Props) {
  if (readOnly) {
    if (value.length === 0) {
      return (
        <Text style={{ marginTop: '0.35em' }} textStyle="body1">
          Not set
        </Text>
      );
    }
    return (
      <Tag.Group>
        {value.map((it, index) => (
          <Tag key={index}>{it.value}</Tag>
        ))}
      </Tag.Group>
    );
  }

  const handleAddValue = () => {
    const item = window.prompt('Enter a value');
    if (item) {
      onChange([...value, { value: item }]);
    }
  };

  const handleRemoveIndex = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <Column style={value.length > 0 ? { marginTop: '0.35em' } : undefined}>
      <Tag.Group>
        {value.map((it, index) => (
          <Tag key={index} transform="">
            {it.value}
            <Tag.Remove onClick={() => handleRemoveIndex(index)} />
          </Tag>
        ))}
      </Tag.Group>
      <Button onClick={handleAddValue}>Add</Button>
    </Column>
  );
}
