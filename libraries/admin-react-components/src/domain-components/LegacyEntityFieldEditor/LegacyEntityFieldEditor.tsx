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
import { FormField } from '../../generic-components/FormField/FormField';
import { LegacyBooleanFieldEditor } from '../LegacyBooleanFieldEditor/LegacyBooleanFieldEditor';
import type { LegacyEntityEditorDraftState } from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import { LegacyEntityFieldListWrapper } from '../LegacyEntityFieldListWrapper/LegacyEntityFieldListWrapper';
import { LegacyEntityItemFieldEditor } from '../LegacyEntityItemFieldEditor/LegacyEntityItemFieldEditor';
import { LegacyLocationFieldEditor } from '../LegacyLocationFieldEditor/LegacyLocationFieldEditor';
import { LegacyRichTextFieldEditor } from '../LegacyRichTextFieldEditor/LegacyRichTextFieldEditor';
import { LegacyStringFieldEditor } from '../LegacyStringFieldEditor/LegacyStringFieldEditor';
import { LegacyValueTypeFieldEditor } from '../LegacyValueTypeFieldEditor/LegacyValueTypeFieldEditor';

interface Props {
  idPrefix: string;
  fieldSpec: FieldSpecification;
  value: unknown;
  draftState: LegacyEntityEditorDraftState;
  valuePath: ItemValuePath;
  onValueChanged: (value: unknown) => void;
}

export interface LegacyEntityFieldEditorProps<T> {
  id: string;
  value: T | null;
  draftState: LegacyEntityEditorDraftState;
  valuePath: ItemValuePath;
  fieldSpec: FieldSpecification;
  onChange?: (value: T | null) => void;
}

export function LegacyEntityFieldEditor({
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
    editor = (
      <LegacyBooleanFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isBooleanListField(fieldSpec, value)) {
    editor = (
      <LegacyEntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={LegacyBooleanFieldEditor}
      />
    );
  } else if (isStringField(fieldSpec, value)) {
    editor = (
      <LegacyStringFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isStringListField(fieldSpec, value)) {
    editor = (
      <LegacyEntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={LegacyStringFieldEditor}
      />
    );
  } else if (isRichTextField(fieldSpec, value)) {
    editor = (
      <LegacyRichTextFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isRichTextListField(fieldSpec, value)) {
    editor = (
      <LegacyEntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={LegacyRichTextFieldEditor}
      />
    );
  } else if (isLocationField(fieldSpec, value)) {
    editor = (
      <LegacyLocationFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isLocationListField(fieldSpec, value)) {
    editor = (
      <LegacyEntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={LegacyLocationFieldEditor}
      />
    );
  } else if (isEntityTypeField(fieldSpec, value)) {
    editor = (
      <LegacyEntityItemFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isEntityTypeListField(fieldSpec, value)) {
    editor = (
      <LegacyEntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={LegacyEntityItemFieldEditor}
      />
    );
  } else if (isValueTypeField(fieldSpec, value)) {
    editor = (
      <LegacyValueTypeFieldEditor {...{ id, value, draftState, valuePath, fieldSpec, onChange }} />
    );
  } else if (isValueTypeListField(fieldSpec, value)) {
    editor = (
      <LegacyEntityFieldListWrapper
        {...{ id, value, draftState, valuePath, fieldSpec, onChange }}
        Editor={LegacyValueTypeFieldEditor}
      />
    );
  } else {
    editor = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }

  const label = fieldSpec.required ? `${fieldSpec.name} (required)` : fieldSpec.name;

  return (
    <FormField htmlFor={id} label={label}>
      {editor}
    </FormField>
  );
}
