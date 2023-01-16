import type { PublishedFieldSpecification } from '@dossierhq/core';
import { Column } from '@dossierhq/design';
import type { FieldDisplayProps } from './FieldDisplay.js';

interface Props<TFieldSpec extends PublishedFieldSpecification, TItem>
  extends FieldDisplayProps<TFieldSpec, TItem[]> {
  Display: React.JSXElementConstructor<FieldDisplayProps<TFieldSpec, TItem>>;
}

export function FieldDisplayListWrapper<TFieldSpec extends PublishedFieldSpecification, Item>({
  value,
  fieldSpec,
  Display,
}: Props<TFieldSpec, Item>): JSX.Element | null {
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
