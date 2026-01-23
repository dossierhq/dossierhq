import type { FieldSpecification } from '@dossierhq/core';
import type { JSX, JSXElementConstructor } from 'react';
import type { FieldDisplayProps } from './FieldDisplay.js';

interface Props<TFieldSpec extends FieldSpecification, TItem> extends FieldDisplayProps<
  TFieldSpec,
  (TItem | null)[]
> {
  Display: JSXElementConstructor<FieldDisplayProps<TFieldSpec, TItem>>;
}

export function FieldListDisplayWrapper<TFieldSpec extends FieldSpecification, TItem>({
  id,
  value,
  fieldSpec,
  Display,
}: Props<TFieldSpec, TItem>): JSX.Element {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto">
      {value && value.length > 0 ? (
        <>
          {value.map((it, index) => {
            return (
              <Display
                key={index}
                id={index === 0 ? id : undefined}
                value={it}
                fieldSpec={fieldSpec}
              />
            );
          })}
        </>
      ) : null}
    </div>
  );
}
