import { Column } from '@jonasb/datadata-design';
import type { FieldDisplayProps } from './FieldDisplay.js';

interface Props<Item> extends FieldDisplayProps<Item[]> {
  Display: React.JSXElementConstructor<FieldDisplayProps<Item>>;
}

export function FieldDisplayListWrapper<Item>({
  value,
  fieldSpec,
  Display,
}: Props<Item>): JSX.Element | null {
  if (!value) return null;
  return (
    <Column gap={3}>
      {value.map((it, index) => {
        return (
          <div key={index} className="nested-value-item-indentation">
            <Display value={it} fieldSpec={fieldSpec} />
          </div>
        );
      })}
    </Column>
  );
}
