import { Input } from '@jonasb/datadata-design';
import React from 'react';
import type { FieldDisplayProps } from './FieldDisplay';

type Props = FieldDisplayProps<string>;

export function StringFieldDisplay({ value }: Props) {
  return <Input value={value ?? ''} readOnly />;
}
