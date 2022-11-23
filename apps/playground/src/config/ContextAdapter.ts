import type {
  AdminDataDataContextAdapter,
  FieldDisplayProps,
  FieldEditorProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import { FieldType, isValueItemField } from '@jonasb/datadata-core';
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
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (
      fieldSpec.type === FieldType.ValueItem &&
      isValueItemField(fieldSpec, value) &&
      value &&
      isAdminCloudinaryImage(value)
    ) {
      return CloudinaryImageFieldEditor({
        ...props,
        fieldSpec,
        value,
      });
    }
    return null;
  }

  renderAdminRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null {
    const { value, onChange } = props;
    if (isAdminCloudinaryImage(value)) {
      return CloudinaryImageFieldEditorWithoutClear({
        value,
        onChange,
      });
    }
    return null;
  }

  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isValueItemField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
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
