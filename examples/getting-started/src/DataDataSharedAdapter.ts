import type {
  AdminDataDataContextAdapter,
  FieldDisplayProps,
  FieldEditorProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';

export class DataDataSharedAdapter
  implements AdminDataDataContextAdapter, PublishedDataDataContextAdapter
{
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    return null;
  }

  renderAdminRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }

  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    return null;
  }

  renderPublishedRichTextValueItemDisplay(
    props: RichTextValueItemDisplayProps
  ): JSX.Element | null {
    return null;
  }
}
