import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { FileProps } from './File.js';
import { File } from './File.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface StoryProps extends FileProps {}

const meta: Meta<FileProps> = {
  title: 'Components/File',
  component: File,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <File {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const Boxed = Template.bind({});
Boxed.args = { boxed: true };

export const Accept = Template.bind({});
Accept.args = { accept: 'image/png, .png' };
