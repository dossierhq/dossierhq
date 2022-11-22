import type {
  BooleanFieldSpecification,
  EntityFieldSpecification,
  LocationFieldSpecification,
  PublishedFieldSpecification,
  RichTextFieldSpecification,
  StringFieldSpecification,
  ValueItemFieldSpecification,
} from '@jonasb/datadata-core';
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
import { Text } from '@jonasb/datadata-design';
import { useContext } from 'react';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import { BooleanFieldDisplay } from './BooleanFieldDisplay.js';
import { EntityTypeFieldDisplay } from './EntityTypeFieldDisplay.js';
import { FieldDisplayListWrapper } from './FieldDisplayListWrapper.js';
import { LocationFieldDisplay } from './LocationFieldDisplay.js';
import { RichTextFieldDisplay } from './RichTextFieldDisplay.js';
import { StringFieldDisplay } from './StringFieldDisplay.js';
import { ValueTypeFieldDisplay } from './ValueTypeFieldDisplay.js';

export interface FieldDisplayProps<
  TFieldSpec extends PublishedFieldSpecification = PublishedFieldSpecification,
  TValue = unknown
> {
  fieldSpec: TFieldSpec;
  value: TValue | null;
}

export function FieldDisplay(props: FieldDisplayProps) {
  const { fieldSpec, value } = props;
  const { adapter } = useContext(PublishedDataDataContext);

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
  if (isBooleanField(fieldSpec, value)) {
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
  } else if (isEntityTypeField(fieldSpec, value)) {
    display = (
      <EntityTypeFieldDisplay fieldSpec={fieldSpec as EntityFieldSpecification} value={value} />
    );
  } else if (isEntityTypeListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as EntityFieldSpecification}
        value={value}
        Display={EntityTypeFieldDisplay}
      />
    );
  } else if (isLocationField(fieldSpec, value)) {
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
  } else if (isRichTextField(fieldSpec, value)) {
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
  } else if (isStringField(fieldSpec, value)) {
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
  } else if (isValueTypeField(fieldSpec, value)) {
    display = (
      <ValueTypeFieldDisplay fieldSpec={fieldSpec as ValueItemFieldSpecification} value={value} />
    );
  } else if (isValueTypeListField(fieldSpec, value)) {
    display = (
      <FieldDisplayListWrapper
        fieldSpec={fieldSpec as ValueItemFieldSpecification}
        value={value}
        Display={ValueTypeFieldDisplay}
      />
    );
  } else {
    display = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return display;
}
