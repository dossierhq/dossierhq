import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { StackProps } from './Stack';
import { Stack } from './Stack';

export default {
  title: 'Generic/Stack',
  component: Stack,
};

const Template: Story<StackProps> = (args) => {
  return <Stack {...args} />;
};

export const GreenBottomWithCenteredYellow = Template.bind({});
GreenBottomWithCenteredYellow.args = {
  children: (
    <>
      <Stack.CenterLayer>
        <div style={{ background: 'yellow', width: '1em', height: '1em' }} />
      </Stack.CenterLayer>
      <div style={{ background: 'green', height: '4em' }} />
    </>
  ),
};
