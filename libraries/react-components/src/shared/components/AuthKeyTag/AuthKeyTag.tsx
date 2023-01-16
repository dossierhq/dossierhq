import { Tag } from '@dossierhq/design';
import type { DisplayAuthKey } from '../../types/DisplayAuthKey.js';

interface Props {
  authKey: string;
  authKeys: DisplayAuthKey[];
}

export function AuthKeyTag({ authKey, authKeys }: Props) {
  const displayName = authKeys.find((it) => it.authKey === authKey)?.displayName ?? authKey;
  return <Tag>{displayName}</Tag>;
}
