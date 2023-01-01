import type {
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import {
  AdminDataDataContextAdapter,
  AdminDataDataProvider,
  useCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from './AuthConfig.js';
import { createAdminClient } from './ClientUtils.js';

interface Props {
  children: React.ReactNode;
}

export function AppAdminProvider({ children }: Props) {
  const cachingAdminMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adminClient: createAdminClient([cachingAdminMiddleware]),
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
