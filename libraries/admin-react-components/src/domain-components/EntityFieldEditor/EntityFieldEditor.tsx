import type { FieldSpecification, ItemValuePath } from '@jonasb/datadata-core';
import {
  isBooleanField,
  isBooleanListField,
  isEntityTypeField,
  isEntityTypeListField,
  isLocationField,
  isLocationListField,
  isRichTextField,
  isRichTextListField,
  isStringField,
  isStringListField,
  isValueTypeField,
  isValueTypeListField,
} from '@jonasb/datadata-core';
import React from 'react';
import {
  BooleanFieldEditor,
  EntityFieldListWrapper,
  EntityItemFieldEditor,
  FormField,
  LocationFieldEditor,
  RichTextFieldEditor,
  StringFieldEditor,
  ValueTypeFieldEditor,
} from '../../index.js';
import type { EntityEditorDraftState } from '../EntityEditor/EntityEditorReducer.js';

interface Props {
  idPrefix: string;
  fieldSpec: FieldSpecification;
  value: unknown;
  draftState: EntityEditorDraftState;
  valuePath: ItemValuePath;
  onValueChanged: (value: unknown) => void;
}

export interface EntityFieldEditorProps<T> {
  id: string;
  value: T | null;
  draftState: EntityEditorDraftState;
  valuePath: ItemValuePath;
  fieldSpec: FieldSpecification;
  onChange?: (value: T | null) => void;
}

export function EntityFieldEditor({
  idPrefix,
  fieldSpec,
  draftState,
  valuePath,
  value,
  onValueChanged: onChange,
}: Props): JSX.Element {
  const id = `${idPrefix}-${fieldSpec.name}`;

  let editor;
  if (isBooleanField(fieldSpec, value)) {
    editor = <BooleanFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />;
  } else if (isBooleanListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={BooleanFieldEditor}
      />
    );
  } else if (isStringField(fieldSpec, value)) {
    editor = <StringFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />;
  } else if (isStringListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={StringFieldEditor}
      />
    );
  } else if (isRichTextField(fieldSpec, value)) {
    editor = <RichTextFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />;
  } else if (isRichTextListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={RichTextFieldEditor}
      />
    );
  } else if (isLocationField(fieldSpec, value)) {
    editor = <LocationFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />;
  } else if (isLocationListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={LocationFieldEditor}
      />
    );
  } else if (isEntityTypeField(fieldSpec, value)) {
    editor = (
      <EntityItemFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isEntityTypeListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={EntityItemFieldEditor}
      />
    );
  } else if (isValueTypeField(fieldSpec, value)) {
    editor = (
      <ValueTypeFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isValueTypeListField(fieldSpec, value)) {
    editor = (
      <EntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={ValueTypeFieldEditor}
      />
    );
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }

  return (
    <FormField htmlFor={id} label={fieldSpec.name}>
      {editor}
    </FormField>
  );
}
