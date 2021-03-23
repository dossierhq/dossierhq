import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useState } from 'react';
import { RichTextFieldEditor } from './RichTextFieldEditor';
import type { RichTextFieldEditorProps } from './RichTextFieldEditor';
import schema from '../../stories/StoryboardSchema';

type RichTextFieldEditorStoryProps = Omit<RichTextFieldEditorProps, 'onChange'>;

const meta: Meta<RichTextFieldEditorStoryProps> = {
  title: 'Domain/RichTextFieldEditor',
  component: RichTextFieldEditor,
  args: {
    id: 'id-123',
    value: null,
    schema,
  },
};
export default meta;

const Template: Story<RichTextFieldEditorStoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper({ value, ...props }: RichTextFieldEditorStoryProps) {
  const [realValue, setRealValue] = useState(value);
  return <RichTextFieldEditor {...props} value={realValue} onChange={setRealValue} />;
}

export const Normal = Template.bind({});
Normal.args = {
  fieldSpec: getFieldSpec('Baz', 'body'),
};

export const NormalWithInitialParagraph = Template.bind({});
NormalWithInitialParagraph.args = {
  fieldSpec: getFieldSpec('Baz', 'body'),
  value: { blocks: [{ type: 'paragraph', data: { text: 'Hello world' } }] },
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
