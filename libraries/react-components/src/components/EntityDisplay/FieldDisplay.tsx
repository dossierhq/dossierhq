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
  type PublishedBooleanFieldSpecification,
  type PublishedComponentFieldSpecification,
  type PublishedFieldSpecification,
  type PublishedLocationFieldSpecification,
  type PublishedNumberFieldSpecification,
  type PublishedReferenceFieldSpecification,
  type PublishedRichTextFieldSpecification,
  type PublishedStringFieldSpecification,
} from '@dossierhq/core';
import { Text } from '@dossierhq/design';
import { useContext } from 'react';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { BooleanFieldDisplay } from './BooleanFieldDisplay.js';
import { ComponentFieldDisplay } from './ComponentFieldDisplay.js';
import { FieldDisplayListWrapper } from './FieldDisplayListWrapper.js';
import { LocationFieldDisplay } from './LocationFieldDisplay.js';
import { NumberFieldDisplay } from './NumberFieldDisplay.js';
import { ReferenceFieldDisplay } from './ReferenceFieldDisplay.js';
import { RichTextFieldDisplay } from './RichTextFieldDisplay.js';
import { StringFieldDisplay } from './StringFieldDisplay.js';

export interface FieldDisplayProps<
  TFieldSpec extends PublishedFieldSpecification = PublishedFieldSpecification,
  TValue = unknown,
> {
  fieldSpec: TFieldSpec;
  value: TValue | null;
}

export function FieldDisplay(props: FieldDisplayProps) {
  const { fieldSpec, value } = props;
  const { adapter } = useContext(PublishedDossierContext);

  const overriddenDisplay = adapter.renderPublishedFieldDisplay(props);
  if (overriddenDisplay) {
    return overriddenDisplay;
  }

  if (value === null) {
    return (
      <Text textStyle="body1">
        <em>Empty</em>
      </Text>
    );
  }

  let display;
  if (isBooleanSingleField(fieldSpec, value)) {
    display = (
      <BooleanFieldDisplay
        fieldSpec={fieldSpec as PublishedBooleanFieldSpecification}
        value={value}
      />
    );
  } else if (isBooleanListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as PublishedBooleanFieldSpecification}
        value={value}
        Display={BooleanFieldDisplay}
      />
    );
  } else if (isReferenceSingleField(fieldSpec, value)) {
    display = (
      <ReferenceFieldDisplay
        fieldSpec={fieldSpec as PublishedReferenceFieldSpecification}
        value={value}
      />
    );
  } else if (isReferenceListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as PublishedReferenceFieldSpecification}
        value={value}
        Display={ReferenceFieldDisplay}
      />
    );
  } else if (isLocationSingleField(fieldSpec, value)) {
    display = (
      <LocationFieldDisplay
        fieldSpec={fieldSpec as PublishedLocationFieldSpecification}
        value={value}
      />
    );
  } else if (isLocationListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as PublishedLocationFieldSpecification}
        value={value}
        Display={LocationFieldDisplay}
      />
    );
  } else if (isNumberSingleField(fieldSpec, value)) {
    display = (
      <NumberFieldDisplay
        fieldSpec={fieldSpec as PublishedNumberFieldSpecification}
        value={value}
      />
    );
  } else if (isNumberListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as PublishedNumberFieldSpecification}
        value={value}
        Display={NumberFieldDisplay}
      />
    );
  } else if (isRichTextSingleField(fieldSpec, value)) {
    display = (
      <RichTextFieldDisplay
        fieldSpec={fieldSpec as PublishedRichTextFieldSpecification}
        value={value}
      />
    );
  } else if (isRichTextListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as PublishedRichTextFieldSpecification}
        value={value}
        Display={RichTextFieldDisplay}
      />
    );
  } else if (isStringSingleField(fieldSpec, value)) {
    display = (
      <StringFieldDisplay
        fieldSpec={fieldSpec as PublishedStringFieldSpecification}
        value={value}
      />
    );
  } else if (isStringListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as PublishedStringFieldSpecification}
        value={value}
        Display={StringFieldDisplay}
      />
    );
  } else if (isComponentSingleField(fieldSpec, value)) {
    display = (
      <ComponentFieldDisplay
        fieldSpec={fieldSpec as PublishedComponentFieldSpecification}
        value={value}
      />
    );
  } else if (isComponentListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as PublishedComponentFieldSpecification}
        value={value}
        Display={ComponentFieldDisplay}
      />
    );
  } else {
    display = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return display;
}
