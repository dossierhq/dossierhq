import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { LoaderProps } from './Loader';
import { Loader } from './Loader';

export default {
  title: 'Generic/Loader',
  component: Loader,
};

const Template: Story<LoaderProps> = (args) => {
  return <Loader {...args} />;
};

export const Normal = Template.bind({});
