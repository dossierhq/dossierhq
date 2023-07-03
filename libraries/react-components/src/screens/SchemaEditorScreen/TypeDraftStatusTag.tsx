import { Tag } from '@dossierhq/design';

export function TypeDraftStatusTag({ status }: { status: 'new' | 'changed' }) {
  const { color, text } = (
    {
      new: { color: 'draft', text: 'New' },
      changed: { color: 'modified', text: 'Changed' },
    } as const
  )[status];
  return <Tag color={color}>{text}</Tag>;
}
