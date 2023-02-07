import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { TextAreaProps } from './TextArea.js';
import { TextArea } from './TextArea.js';

type StoryProps = TextAreaProps;

const meta: Meta<TextAreaProps> = {
  title: 'Components/TextArea',
  component: TextArea,
  args: { defaultValue: 'Hello world' },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <TextArea {...args} />;
};

export const Normal = Template.bind({});

export const ReadOnly = Template.bind({});
ReadOnly.args = { readOnly: true };

export const CodeTextStyle = Template.bind({});
CodeTextStyle.args = { textStyle: 'code2' };

export const FixedSize = Template.bind({});
FixedSize.args = { fixedSize: true };
