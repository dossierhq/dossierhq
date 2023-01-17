import type {
  AdminFieldSpecification,
  BooleanFieldSpecification,
  EntityFieldSpecification,
  FieldSpecification,
  LocationFieldSpecification,
  NumberFieldSpecification,
  RichTextFieldSpecification,
  StringFieldSpecification,
  ValidationError,
  ValueItemFieldSpecification,
} from '@dossierhq/core';
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
} from '@dossierhq/core';
import { useContext } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { BooleanFieldEditor } from './BooleanFieldEditor.js';
import { EntityTypeFieldEditor } from './EntityTypeFieldEditor.js';
import { FieldListWrapper } from './FieldListWrapper.js';
import { LocationFieldEditor } from './LocationFieldEditor.js';
import { NumberFieldEditor } from './NumberFieldEditor.js';
import { RichTextFieldEditor } from './RichTextFieldEditor.js';
import { StringFieldEditor } from './StringFieldEditor.js';
import { ValueTypeFieldEditor } from './ValueTypeFieldEditor.js';

export interface FieldEditorProps<
  TFieldSpec extends FieldSpecification = FieldSpecification,
  TValue = unknown
> {
  fieldSpec: AdminFieldSpecification<TFieldSpec>;
  value: TValue | null;
  onChange: (value: TValue | null) => void;
  validationErrors: ValidationError[];
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
        Editor={StringFieldEditor}
      />
    );
  } else if (isValueItemField(fieldSpec, value)) {
    editor = (
      <ValueTypeFieldEditor
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
        Editor={ValueTypeFieldEditor}
      />
    );
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return editor;
}
