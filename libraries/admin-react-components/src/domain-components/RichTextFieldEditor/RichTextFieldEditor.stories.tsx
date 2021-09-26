import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import schema from '../../stories/StoryboardSchema';
import { bar2Id, foo1Id } from '../../test/EntityFixtures';
import { LoadContextProvider } from '../../test/LoadContextProvider';
import { LoadFixtures } from '../../test/LoadFixtures';
import type { RichTextFieldEditorProps } from './RichTextFieldEditor';
import { RichTextFieldEditor } from './RichTextFieldEditor';

export type RichTextFieldEditorStoryProps = Omit<RichTextFieldEditorProps, 'onChange'>;

const meta: Meta<RichTextFieldEditorStoryProps> = {
  title: 'Domain/RichTextFieldEditor',
  component: RichTextFieldEditor,
  args: {
    id: 'id-123',
    value: null,
  },
};
export default meta;

const Template: Story<RichTextFieldEditorStoryProps> = (args) => {
  return (
    <LoadContextProvider>
      <LoadFixtures>
        <Wrapper {...args} />
      </LoadFixtures>
    </LoadContextProvider>
  );
};

function Wrapper({ value, ...props }: RichTextFieldEditorStoryProps) {
  const [realValue, setRealValue] = useState(value);
  return <RichTextFieldEditor {...props} value={realValue} onChange={setRealValue} />;
}

export const Normal = Template.bind({});
Normal.args = {
  fieldSpec: getFieldSpec('Baz', 'body'),
};

export const NormalWithParagraph = Template.bind({});
NormalWithParagraph.args = {
  fieldSpec: getFieldSpec('Baz', 'body'),
  value: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
};

export const NormalWithValueItem = Template.bind({});
NormalWithValueItem.args = {
  fieldSpec: getFieldSpec('Baz', 'body'),
  value: {
    blocks: [
      {
        type: 'valueItem',
        data: { type: 'AnnotatedBar', annotation: 'Annotation', bar: { id: bar2Id } },
      },
    ],
  },
};

export const NormalWithEntity = Template.bind({});
NormalWithEntity.args = {
  fieldSpec: getFieldSpec('Baz', 'body'),
  value: { blocks: [{ type: 'entity', data: { id: foo1Id } }] },
};

export const OnlyBar = Template.bind({});
OnlyBar.args = {
  fieldSpec: getFieldSpec('Baz', 'bodyBar'),
};

export const OnlyNested = Template.bind({});
OnlyNested.args = {
  fieldSpec: getFieldSpec('Baz', 'bodyNested'),
};

function getFieldSpec(entityType: string, fieldName: string) {
  const entitySpec = schema.getEntityTypeSpecification(entityType);
  if (!entitySpec) {
    throw new Error('Entity not available: ' + entityType);
  }
  const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
  if (!fieldSpec) {
    throw new Error(`Field not available ${entityType}/${fieldName}`);
  }
  return fieldSpec;
}
