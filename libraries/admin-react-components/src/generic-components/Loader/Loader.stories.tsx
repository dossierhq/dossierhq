import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { LoaderProps } from './Loader';
import { Loader } from './Loader';

const meta: Meta<LoaderProps> = {
  title: 'Generic/Loader',
  component: Loader,
};
export default meta;

const Template: Story<LoaderProps> = (args) => {
  return <Loader {...args} />;
};

export const Normal = Template.bind({});
