import {
  isBooleanListField,
  isBooleanSingleField,
  isLocationListField,
  isLocationSingleField,
  isNumberListField,
  isNumberSingleField,
  isStringListField,
  isStringSingleField,
  type BooleanFieldSpecification,
  type FieldSpecification,
  type LocationFieldSpecification,
  type NumberFieldSpecification,
  type StringFieldSpecification,
} from '@dossierhq/core';
import type { JSX, ReactNode } from 'react';
import { BooleanFieldDisplay } from './BooleanFieldDisplay.js';
import { FieldListDisplayWrapper } from './FieldListDisplayWrapper.js';
import { LocationFieldDisplay } from './LocationFieldDisplay.js';
import { NumberFieldDisplay } from './NumberFieldDisplay.js';
import { StringFieldDisplay } from './StringFieldDisplay.js';

export interface FieldDisplayProps<
  TFieldSpec extends FieldSpecification = FieldSpecification,
  TValue = unknown,
> {
  id?: string;
  fieldSpec: TFieldSpec;
  value: TValue | null;
  dragHandle?: ReactNode;
}

export function FieldDisplay(props: FieldDisplayProps) {
  const { fieldSpec, value } = props;

  /*TODO
  const { adapter } = useContext(DossierContext);
  const overriddenEditor = adapter.renderFieldEditor(props);
  if (overriddenEditor) {
    return overriddenEditor;
  }
  */

  let display: JSX.Element;
  if (isBooleanSingleField(fieldSpec, value)) {
    display = (
      <BooleanFieldDisplay
        {...props}
        fieldSpec={fieldSpec as BooleanFieldSpecification}
        value={value}
      />
    );
  } else if (isBooleanListField(fieldSpec, value)) {
    display = (
      <FieldListDisplayWrapper
        {...props}
        fieldSpec={fieldSpec as BooleanFieldSpecification}
        value={value}
        Display={BooleanFieldDisplay}
      />
    );
  } else if (isNumberSingleField(fieldSpec, value)) {
    display = (
      <NumberFieldDisplay
        {...props}
        fieldSpec={fieldSpec as NumberFieldSpecification}
        value={value}
      />
    );
  } else if (isNumberListField(fieldSpec, value)) {
    display = (
      <FieldListDisplayWrapper
        {...props}
        fieldSpec={fieldSpec as NumberFieldSpecification}
        value={value}
        Display={NumberFieldDisplay}
      />
    );
  } else if (isLocationSingleField(fieldSpec, value)) {
    display = (
      <LocationFieldDisplay
        {...props}
        fieldSpec={fieldSpec as LocationFieldSpecification}
        value={value}
      />
    );
  } else if (isLocationListField(fieldSpec, value)) {
    display = (
      <FieldListDisplayWrapper
        {...props}
        fieldSpec={fieldSpec as LocationFieldSpecification}
        value={value}
        Display={LocationFieldDisplay}
      />
    );
  } else if (isStringSingleField(fieldSpec, value)) {
    /* TODO
  else if (isReferenceSingleField(fieldSpec, value)) {
    editor = (
      <ReferenceFieldEditor
        {...props}
        fieldSpec={fieldSpec as ReferenceFieldSpecification}
        value={value}
      />
    );
  } else if (isReferenceListField(fieldSpec, value)) {
    editor = (
      <FieldListWrapper
        {...props}
        fieldSpec={fieldSpec as ReferenceFieldSpecification}
        value={value}
        AddButton={AddEntityListItemButton}
        Editor={ReferenceFieldEditor}
      />
    );
  } else if (isRichTextSingleField(fieldSpec, value)) {
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
    display = (
      <StringFieldDisplay
        {...props}
        fieldSpec={fieldSpec as StringFieldSpecification}
        value={value}
      />
    );
  } else if (isStringListField(fieldSpec, value)) {
    display = (
      <FieldListDisplayWrapper
        {...props}
        fieldSpec={fieldSpec as StringFieldSpecification}
        value={value}
        Display={StringFieldDisplay}
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
    display = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return display;
}
