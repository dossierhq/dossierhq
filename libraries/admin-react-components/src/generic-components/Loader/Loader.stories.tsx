import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { LoaderProps } from './Loader.js';
import { Loader } from './Loader.js';

const meta: Meta<LoaderProps> = {
  title: 'Generic/Loader',
  component: Loader,
};
export default meta;

const Template: Story<LoaderProps> = (args) => {
  return <Loader {...args} />;
};

export const Normal = Template.bind({});
