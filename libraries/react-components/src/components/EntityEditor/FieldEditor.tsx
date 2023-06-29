import {
  isBooleanField,
  isBooleanListField,
  isEntityField,
  isEntityListField,
  isLocationField,
  isLocationListField,
  isNumberField,
  isNumberListField,
  isRichTextField,
  isRichTextListField,
  isStringField,
  isStringListField,
  isValueItemField,
  isValueItemListField,
  type AdminFieldSpecification,
  type BooleanFieldSpecification,
  type EntityFieldSpecification,
  type FieldSpecification,
  type LocationFieldSpecification,
  type NumberFieldSpecification,
  type PublishValidationIssue,
  type RichTextFieldSpecification,
  type SaveValidationIssue,
  type StringFieldSpecification,
  type ValueItemFieldSpecification,
} from '@dossierhq/core';
import { useContext } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { AddBooleanListItemButton, BooleanFieldEditor } from './BooleanFieldEditor.js';
import { AddEntityListItemButton, EntityTypeFieldEditor } from './EntityTypeFieldEditor.js';
import { FieldListWrapper } from './FieldListWrapper.js';
import { AddLocationListItemButton, LocationFieldEditor } from './LocationFieldEditor.js';
import { AddNumberListItemButton, NumberFieldEditor } from './NumberFieldEditor.js';
import { AddRichTextListItemButton, RichTextFieldEditor } from './RichTextFieldEditor.js';
import { AddStringListItemButton, StringFieldEditor } from './StringFieldEditor.js';
import { AddValueItemListItemButton, ValueItemFieldEditor } from './ValueItemFieldEditor.js';

export interface FieldEditorProps<
  TFieldSpec extends FieldSpecification = FieldSpecification,
  TValue = unknown
> {
  fieldSpec: AdminFieldSpecification<TFieldSpec>;
  adminOnly: boolean;
  value: TValue | null;
  onChange: (value: TValue | null) => void;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
}

export function FieldEditor(props: FieldEditorProps) {
  const { fieldSpec, value } = props;
  const { adapter } = useContext(AdminDossierContext);

  const overriddenEditor = adapter.renderAdminFieldEditor(props);
  if (overriddenEditor) {
    return overriddenEditor;
  }

  let editor: JSX.Element;
  if (isBooleanField(fieldSpec, value)) {
    editor = (
      <BooleanFieldEditor
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<BooleanFieldSpecification>}
        value={value}
      />
    );
  } else if (isBooleanListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<BooleanFieldSpecification>}
        value={value}
        AddButton={AddBooleanListItemButton}
        Editor={BooleanFieldEditor}
      />
    );
  } else if (isEntityField(fieldSpec, value)) {
    editor = (
      <EntityTypeFieldEditor
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<EntityFieldSpecification>}
        value={value}
      />
    );
  } else if (isEntityListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<EntityFieldSpecification>}
        value={value}
        AddButton={AddEntityListItemButton}
        Editor={EntityTypeFieldEditor}
      />
    );
  } else if (isLocationField(fieldSpec, value)) {
    editor = (
      <LocationFieldEditor
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<LocationFieldSpecification>}
        value={value}
      />
    );
  } else if (isLocationListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<LocationFieldSpecification>}
        value={value}
        AddButton={AddLocationListItemButton}
        Editor={LocationFieldEditor}
      />
    );
  } else if (isNumberField(fieldSpec, value)) {
    editor = (
      <NumberFieldEditor
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<NumberFieldSpecification>}
        value={value}
      />
    );
  } else if (isNumberListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<NumberFieldSpecification>}
        value={value}
        AddButton={AddNumberListItemButton}
        Editor={NumberFieldEditor}
      />
    );
  } else if (isRichTextField(fieldSpec, value)) {
    editor = (
      <RichTextFieldEditor
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<RichTextFieldSpecification>}
        value={value}
      />
    );
  } else if (isRichTextListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<RichTextFieldSpecification>}
        value={value}
        AddButton={AddRichTextListItemButton}
        Editor={RichTextFieldEditor}
      />
    );
  } else if (isStringField(fieldSpec, value)) {
    editor = (
      <StringFieldEditor
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<StringFieldSpecification>}
        value={value}
      />
    );
  } else if (isStringListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<StringFieldSpecification>}
        value={value}
        AddButton={AddStringListItemButton}
        Editor={StringFieldEditor}
      />
    );
  } else if (isValueItemField(fieldSpec, value)) {
    editor = (
      <ValueItemFieldEditor
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<ValueItemFieldSpecification>}
        value={value}
      />
    );
  } else if (isValueItemListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as AdminFieldSpecification<ValueItemFieldSpecification>}
        value={value}
        AddButton={AddValueItemListItemButton}
        Editor={ValueItemFieldEditor}
      />
    );
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return editor;
}
