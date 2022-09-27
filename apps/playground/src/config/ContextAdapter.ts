import type {
  AdminDataDataContextAdapter,
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import { isValueTypeField } from '@jonasb/datadata-core';
import {
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
  isAdminImage,
} from '../components/CloudinaryImageFieldEditor.js';

export class ContextAdapter implements AdminDataDataContextAdapter {
  renderFieldEditor(props: FieldEditorProps<unknown>): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isValueTypeField(fieldSpec, value) && value && isAdminImage(value)) {
      return CloudinaryImageFieldEditor({ ...props, value });
    }
    return null;
  }

  renderRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null {
    const { value, onChange } = props;
    if (isAdminImage(value)) {
      return CloudinaryImageFieldEditorWithoutClear({
        value,
        onChange,
      });
    }
    return null;
  }
}
