import {
  isBooleanListField,
  isBooleanSingleField,
  isLocationListField,
  isLocationSingleField,
  isNumberListField,
  isNumberSingleField,
  isReferenceListField,
  isReferenceSingleField,
  isStringListField,
  isStringSingleField,
  type BooleanFieldSpecification,
  type FieldSpecification,
  type LocationFieldSpecification,
  type NumberFieldSpecification,
  type PublishValidationIssue,
  type ReferenceFieldSpecification,
  type SaveValidationIssue,
  type StringFieldSpecification,
} from '@dossierhq/core';
import type { JSX, ReactNode } from 'react';
import { AddBooleanListItemButton, BooleanFieldEditor } from './BooleanFieldEditor.js';
import { FieldListEditorWrapper } from './FieldListEditorWrapper.js';
import { AddLocationListItemButton, LocationFieldEditor } from './LocationFieldEditor.js';
import { AddNumberListItemButton, NumberFieldEditor } from './NumberFieldEditor.js';
import { AddEntityListItemButton, ReferenceFieldEditor } from './ReferenceFieldEditor.js';
import { AddStringListItemButton, StringFieldEditor } from './StringFieldEditor.js';

export interface FieldEditorProps<
  TFieldSpec extends FieldSpecification = FieldSpecification,
  TValue = unknown,
> {
  id?: string;
  fieldSpec: TFieldSpec;
  adminOnly: boolean;
  value: TValue | null;
  dragHandle?: ReactNode;
  onChange: (value: TValue | null) => void;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
}

export function FieldEditor(props: FieldEditorProps) {
  const { fieldSpec, value } = props;

  /*TODO
  const { adapter } = useContext(DossierContext);
  const overriddenEditor = adapter.renderFieldEditor(props);
  if (overriddenEditor) {
    return overriddenEditor;
  }
  */

  let editor: JSX.Element;
  if (isBooleanSingleField(fieldSpec, value)) {
    editor = (
      <BooleanFieldEditor
        {...props}
        fieldSpec={fieldSpec as BooleanFieldSpecification}
        value={value}
      />
    );
  } else if (isBooleanListField(fieldSpec, value)) {
    editor = (
      <FieldListEditorWrapper
        {...props}
        fieldSpec={fieldSpec as BooleanFieldSpecification}
        value={value}
        AddButton={AddBooleanListItemButton}
        Editor={BooleanFieldEditor}
      />
    );
  } else if (isNumberSingleField(fieldSpec, value)) {
    editor = (
      <NumberFieldEditor
        {...props}
        fieldSpec={fieldSpec as NumberFieldSpecification}
        value={value}
      />
    );
  } else if (isNumberListField(fieldSpec, value)) {
    editor = (
      <FieldListEditorWrapper
        {...props}
        fieldSpec={fieldSpec as NumberFieldSpecification}
        value={value}
        AddButton={AddNumberListItemButton}
        Editor={NumberFieldEditor}
      />
    );
  } else if (isLocationSingleField(fieldSpec, value)) {
    editor = (
      <LocationFieldEditor
        {...props}
        fieldSpec={fieldSpec as LocationFieldSpecification}
        value={value}
      />
    );
  } else if (isLocationListField(fieldSpec, value)) {
    editor = (
      <FieldListEditorWrapper
        {...props}
        fieldSpec={fieldSpec as LocationFieldSpecification}
        value={value}
        AddButton={AddLocationListItemButton}
        Editor={LocationFieldEditor}
      />
    );
  } else if (isReferenceSingleField(fieldSpec, value)) {
    editor = (
      <ReferenceFieldEditor
        {...props}
        fieldSpec={fieldSpec as ReferenceFieldSpecification}
        value={value}
      />
    );
  } else if (isReferenceListField(fieldSpec, value)) {
    editor = (
      <FieldListEditorWrapper
        {...props}
        fieldSpec={fieldSpec as ReferenceFieldSpecification}
        value={value}
        AddButton={AddEntityListItemButton}
        Editor={ReferenceFieldEditor}
      />
    );
  } else if (isStringSingleField(fieldSpec, value)) {
    /* TODO
  else if (isRichTextSingleField(fieldSpec, value)) {
    editor = (
      <RichTextFieldEditor
        {...props}
        fieldSpec={fieldSpec as RichTextFieldSpecification}
        value={value}
      />
    );
  } else if (isRichTextListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as RichTextFieldSpecification}
        value={value}
        AddButton={AddRichTextListItemButton}
        Editor={RichTextFieldEditor}
      />
    );
  }
  */
    editor = (
      <StringFieldEditor
        {...props}
        fieldSpec={fieldSpec as StringFieldSpecification}
        value={value}
      />
    );
  } else if (isStringListField(fieldSpec, value)) {
    editor = (
      <FieldListEditorWrapper
        {...props}
        fieldSpec={fieldSpec as StringFieldSpecification}
        value={value}
        AddButton={AddStringListItemButton}
        Editor={StringFieldEditor}
      />
    );
    /*
  } else if (isComponentSingleField(fieldSpec, value)) {
    editor = (
      <ComponentFieldEditor
        {...props}
        fieldSpec={fieldSpec as ComponentFieldSpecification}
        value={value}
      />
    );
  } else if (isComponentListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as ComponentFieldSpecification}
        value={value}
        AddButton={AddComponentListItemButton}
        Editor={ComponentFieldEditor}
      />
    );
  */
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return editor;
}
