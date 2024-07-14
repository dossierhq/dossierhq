import type { FieldSpecification } from '@dossierhq/core';
import { useId } from 'react';
import { FieldDisplay } from './FieldDisplay.js';
import { Badge } from './ui/badge.js';
import { Label } from './ui/label.js';

interface Props {
  fieldSpec: FieldSpecification;
  value: unknown;
}

export function EntityFieldDisplay({ fieldSpec, value }: Props) {
  const id = useId();
  //TODO no need to show admin only and required tags when the "type"/context is admin only
  return (
    <>
      <div className="mb-1 flex items-baseline gap-2 py-2">
        <Label className="w-0 grow" htmlFor={id}>
          {fieldSpec.name}
        </Label>
        {fieldSpec.adminOnly && <Badge variant="outline">Admin only</Badge>}
        {!fieldSpec.adminOnly && fieldSpec.required && <Badge variant="outline">Required</Badge>}
      </div>
      <div className="flex max-h-[80vh] flex-col">
        <FieldDisplay id={id} fieldSpec={fieldSpec} value={value} />
      </div>
    </>
  );
}
