import {
  isBooleanListField,
  isBooleanSingleField,
  isComponentListField,
  isComponentSingleField,
  isLocationListField,
  isLocationSingleField,
  isNumberListField,
  isNumberSingleField,
  isReferenceListField,
  isReferenceSingleField,
  isRichTextListField,
  isRichTextSingleField,
  isStringListField,
  isStringSingleField,
  type BooleanFieldSpecification,
  type ComponentFieldSpecification,
  type FieldSpecification,
  type LocationFieldSpecification,
  type NumberFieldSpecification,
  type ReferenceFieldSpecification,
  type RichTextFieldSpecification,
  type StringFieldSpecification,
} from '@dossierhq/core';
import { useContext, type JSX, type ReactNode } from 'react';
import { DossierContext } from '../contexts/DossierContext.js';
import { BooleanFieldDisplay } from './BooleanFieldDisplay.js';
import { ComponentFieldDisplay } from './ComponentFieldDisplay.js';
import { FieldListDisplayWrapper } from './FieldListDisplayWrapper.js';
import { LocationFieldDisplay } from './LocationFieldDisplay.js';
import { NumberFieldDisplay } from './NumberFieldDisplay.js';
import { ReferenceFieldDisplay } from './ReferenceFieldDisplay.js';
import { RichTextFieldDisplay } from './RichTextFieldDisplayLazy.js';
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

  const { adapter } = useContext(DossierContext);
  const overriddenDisplay = adapter?.renderFieldDisplay(props);
  if (overriddenDisplay) {
    return overriddenDisplay;
  }

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
  } else if (isReferenceSingleField(fieldSpec, value)) {
    display = (
      <ReferenceFieldDisplay
        {...props}
        fieldSpec={fieldSpec as ReferenceFieldSpecification}
        value={value}
      />
    );
  } else if (isReferenceListField(fieldSpec, value)) {
    display = (
      <FieldListDisplayWrapper
        {...props}
        fieldSpec={fieldSpec as ReferenceFieldSpecification}
        value={value}
        Display={ReferenceFieldDisplay}
      />
    );
  } else if (isRichTextSingleField(fieldSpec, value)) {
    display = (
      <RichTextFieldDisplay
        {...props}
        fieldSpec={fieldSpec as RichTextFieldSpecification}
        value={value}
      />
    );
  } else if (isRichTextListField(fieldSpec, value)) {
    display = (
      <FieldListDisplayWrapper
        {...props}
        fieldSpec={fieldSpec as RichTextFieldSpecification}
        value={value}
        Display={RichTextFieldDisplay}
      />
    );
  } else if (isStringSingleField(fieldSpec, value)) {
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
  } else if (isComponentSingleField(fieldSpec, value)) {
    display = (
      <ComponentFieldDisplay
        {...props}
        fieldSpec={fieldSpec as ComponentFieldSpecification}
        value={value}
      />
    );
  } else if (isComponentListField(fieldSpec, value)) {
    display = (
      <FieldListDisplayWrapper
        {...props}
        fieldSpec={fieldSpec as ComponentFieldSpecification}
        value={value}
        Display={ComponentFieldDisplay}
      />
    );
  } else {
    display = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return display;
}
