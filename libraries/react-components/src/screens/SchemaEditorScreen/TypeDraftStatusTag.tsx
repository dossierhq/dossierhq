import { Tag } from '@jonasb/datadata-design';
import React from 'react';

export function TypeDraftStatusTag({ status }: { status: 'new' | 'changed' }) {
  const { color, text } = (
    {
      new: { color: 'draft', text: 'New' },
      changed: { color: 'modified', text: 'Changed' },
    } as const
  )[status];
  return <Tag color={color}>{text}</Tag>;
}
