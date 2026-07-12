import { Badge } from './ui/badge.js';

export function TypeDraftStatusBadge({ status }: { status: 'new' | 'changed' }) {
  const { variant, text } = (
    {
      new: { variant: 'default', text: 'New' },
      changed: { variant: 'secondary', text: 'Changed' },
    } as const
  )[status];
  return <Badge variant={variant}>{text}</Badge>;
}
