import type {
  BooleanFieldSpecification,
  ComponentFieldSpecification,
  EntityFieldSpecification,
  LocationFieldSpecification,
  NumberFieldSpecification,
  PublishedFieldSpecification,
  RichTextFieldSpecification,
  StringFieldSpecification,
} from '@dossierhq/core';
import {
  isBooleanListField,
  isBooleanSingleField,
  isComponentListField,
  isComponentSingleField,
  isEntityListField,
  isEntitySingleField,
  isLocationListField,
  isLocationSingleField,
  isNumberListField,
  isNumberSingleField,
  isRichTextListField,
  isRichTextSingleField,
  isStringListField,
  isStringSingleField,
} from '@dossierhq/core';
import { Text } from '@dossierhq/design';
import { useContext } from 'react';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { BooleanFieldDisplay } from './BooleanFieldDisplay.js';
import { EntityTypeFieldDisplay } from './EntityTypeFieldDisplay.js';
import { FieldDisplayListWrapper } from './FieldDisplayListWrapper.js';
import { LocationFieldDisplay } from './LocationFieldDisplay.js';
import { NumberFieldDisplay } from './NumberFieldDisplay.js';
import { RichTextFieldDisplay } from './RichTextFieldDisplay.js';
import { StringFieldDisplay } from './StringFieldDisplay.js';
import { ComponentFieldDisplay } from './ComponentFieldDisplay.js';

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
      <BooleanFieldDisplay fieldSpec={fieldSpec as BooleanFieldSpecification} value={value} />
    );
  } else if (isBooleanListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as BooleanFieldSpecification}
        value={value}
        Display={BooleanFieldDisplay}
      />
    );
  } else if (isEntitySingleField(fieldSpec, value)) {
    display = (
      <EntityTypeFieldDisplay fieldSpec={fieldSpec as EntityFieldSpecification} value={value} />
    );
  } else if (isEntityListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as EntityFieldSpecification}
        value={value}
        Display={EntityTypeFieldDisplay}
      />
    );
  } else if (isLocationSingleField(fieldSpec, value)) {
    display = (
      <LocationFieldDisplay fieldSpec={fieldSpec as LocationFieldSpecification} value={value} />
    );
  } else if (isLocationListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as LocationFieldSpecification}
        value={value}
        Display={LocationFieldDisplay}
      />
    );
  } else if (isNumberSingleField(fieldSpec, value)) {
    display = (
      <NumberFieldDisplay fieldSpec={fieldSpec as NumberFieldSpecification} value={value} />
    );
  } else if (isNumberListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as NumberFieldSpecification}
        value={value}
        Display={NumberFieldDisplay}
      />
    );
  } else if (isRichTextSingleField(fieldSpec, value)) {
    display = (
      <RichTextFieldDisplay fieldSpec={fieldSpec as RichTextFieldSpecification} value={value} />
    );
  } else if (isRichTextListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as RichTextFieldSpecification}
        value={value}
        Display={RichTextFieldDisplay}
      />
    );
  } else if (isStringSingleField(fieldSpec, value)) {
    display = (
      <StringFieldDisplay fieldSpec={fieldSpec as StringFieldSpecification} value={value} />
    );
  } else if (isStringListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as StringFieldSpecification}
        value={value}
        Display={StringFieldDisplay}
      />
    );
  } else if (isComponentSingleField(fieldSpec, value)) {
    display = (
      <ComponentFieldDisplay fieldSpec={fieldSpec as ComponentFieldSpecification} value={value} />
    );
  } else if (isComponentListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
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
