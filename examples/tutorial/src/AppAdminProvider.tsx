import type {
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import {
  AdminDataDataContextAdapter,
  AdminDataDataProvider,
} from '@jonasb/datadata-admin-react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from './AuthConfig.js';
import { useAdminClient } from './ClientUtils.js';

interface Props {
  children: React.ReactNode;
}

export function AppAdminProvider({ children }: Props) {
  const adminClient = useAdminClient();
  const args = useMemo(
    () => ({
      adapter: new AdminAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    []
  );

  if (!adminClient) return null;

  return (
    <AdminDataDataProvider {...args} adminClient={adminClient}>
      {children}
    </AdminDataDataProvider>
  );
}

class AdminAdapter implements AdminDataDataContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    return null;
  }

  renderAdminRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }
}
