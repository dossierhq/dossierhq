import type { PublishedFieldSpecification } from '@jonasb/datadata-core';
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
import { BooleanFieldDisplay } from './BooleanFieldDisplay.js';
import { EntityTypeFieldDisplay } from './EntityTypeFieldDisplay.js';
import { FieldDisplayListWrapper } from './FieldDisplayListWrapper.js';
import { LocationFieldDisplay } from './LocationFieldDisplay.js';
import { RichTextFieldDisplay } from './RichTextFieldDisplay.js';
import { StringFieldDisplay } from './StringFieldDisplay.js';
import { ValueTypeFieldDisplay } from './ValueTypeFieldDisplay.js';

export interface FieldDisplayProps<T> {
  fieldSpec: PublishedFieldSpecification;
  value: T | null;
}

export function FieldDisplay({ value, ...props }: FieldDisplayProps<unknown>) {
  const { fieldSpec } = props;

  if (value === null) {
    return (
      <Text textStyle="body1">
        <em>Empty</em>
      </Text>
    );
  }

  let display;
  if (isBooleanField(fieldSpec, value)) {
    display = <BooleanFieldDisplay {...props} value={value} />;
  } else if (isBooleanListField(fieldSpec, value)) {
    display = <FieldDisplayListWrapper {...props} value={value} Display={BooleanFieldDisplay} />;
  } else if (isEntityTypeField(fieldSpec, value)) {
    display = <EntityTypeFieldDisplay {...props} value={value} />;
  } else if (isEntityTypeListField(fieldSpec, value)) {
    display = <FieldDisplayListWrapper {...props} value={value} Display={EntityTypeFieldDisplay} />;
  } else if (isLocationField(fieldSpec, value)) {
    display = <LocationFieldDisplay {...props} value={value} />;
  } else if (isLocationListField(fieldSpec, value)) {
    display = <FieldDisplayListWrapper {...props} value={value} Display={LocationFieldDisplay} />;
  } else if (isRichTextField(fieldSpec, value)) {
    display = <RichTextFieldDisplay {...props} value={value} />;
  } else if (isRichTextListField(fieldSpec, value)) {
    display = <FieldDisplayListWrapper {...props} value={value} Display={RichTextFieldDisplay} />;
  } else if (isStringField(fieldSpec, value)) {
    display = <StringFieldDisplay {...props} value={value} />;
  } else if (isStringListField(fieldSpec, value)) {
    display = <FieldDisplayListWrapper {...props} value={value} Display={StringFieldDisplay} />;
  } else if (isValueTypeField(fieldSpec, value)) {
    display = <ValueTypeFieldDisplay {...props} value={value} />;
  } else if (isValueTypeListField(fieldSpec, value)) {
    display = <FieldDisplayListWrapper {...props} value={value} Display={ValueTypeFieldDisplay} />;
  } else {
    display = <div>{`${fieldSpec.type} (list: ${!!fieldSpec.list})`} is not supported</div>;
  }
  return display;
}
