import type { RichText, RichTextFieldSpecification } from '@dossierhq/core';
import { lazy, Suspense } from 'react';
import type { FieldDisplayProps } from './FieldDisplay.js';

// Keep Lexical out of the synchronous bundle by loading the display lazily
const RichTextFieldDisplayInner = lazy(() =>
  import('./richtext/RichTextFieldDisplay.js').then((it) => ({
    default: it.RichTextFieldDisplay,
  })),
);

type Props = FieldDisplayProps<RichTextFieldSpecification, RichText>;

export function RichTextFieldDisplay({ id, fieldSpec, value }: Props) {
  return (
    <Suspense>
      <RichTextFieldDisplayInner id={id} fieldSpec={fieldSpec} value={value} />
    </Suspense>
  );
}
