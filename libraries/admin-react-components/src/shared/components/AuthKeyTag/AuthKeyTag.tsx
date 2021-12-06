import { Tag } from '@jonasb/datadata-design';
import React from 'react';

interface Props {
  authKey: string;
  displayName: string | null;
}

export function AuthKeyTag({ authKey, displayName }: Props) {
  return <Tag>{displayName ? displayName : authKey}</Tag>;
}
