import type {
  AdminDataDataContextAdapter,
  FieldDisplayProps,
  FieldEditorProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import { isValueTypeField } from '@jonasb/datadata-core';
import {
  CloudinaryImageFieldDisplay,
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
  isAdminCloudinaryImage,
  isPublishedCloudinaryImage,
} from '../components/CloudinaryImageFieldEditor.js';

export class ContextAdapter
  implements AdminDataDataContextAdapter, PublishedDataDataContextAdapter
{
  renderFieldEditor(props: FieldEditorProps<unknown>): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isValueTypeField(fieldSpec, value) && value && isAdminCloudinaryImage(value)) {
      return CloudinaryImageFieldEditor({ ...props, value });
    }
    return null;
  }

  renderRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null {
    const { value, onChange } = props;
    if (isAdminCloudinaryImage(value)) {
      return CloudinaryImageFieldEditorWithoutClear({
        value,
        onChange,
      });
    }
    return null;
  }

  renderPublishedFieldDisplay(props: FieldDisplayProps<unknown>): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isValueTypeField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({ value });
    }
    return null;
  }

  renderPublishedRichTextValueItemDisplay({
    value,
  }: RichTextValueItemDisplayProps): JSX.Element | null {
    if (value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({ value });
    }
    return null;
  }
}
