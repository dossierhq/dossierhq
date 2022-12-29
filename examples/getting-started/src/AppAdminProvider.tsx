import type {
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import {
  AdminDataDataContextAdapter,
  AdminDataDataProvider,
  DisplayAuthKey,
  useCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import { AdminClient } from '@jonasb/datadata-core';
import { useMemo } from 'react';
import { createAdminClient } from './ClientUtils.js';

const DISPLAY_AUTH_KEYS: DisplayAuthKey[] = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];

interface Props {
  children: React.ReactNode;
}

export function AppAdminProvider({ children }: Props) {
  const cachingAdminMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adminClient: createAdminClient([cachingAdminMiddleware]) as unknown as AdminClient,
      adapter: new AdminAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [cachingAdminMiddleware]
  );

  return <AdminDataDataProvider {...args}>{children}</AdminDataDataProvider>;
}

class AdminAdapter implements AdminDataDataContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    return null;
  }

  renderAdminRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }
}
