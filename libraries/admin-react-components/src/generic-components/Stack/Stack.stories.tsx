import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { StackProps } from './Stack.js';
import { Stack } from './Stack.js';

const meta: Meta<StackProps> = {
  title: 'Generic/Stack',
  component: Stack,
};
export default meta;

const Template: Story<StackProps> = (args) => {
  return <Stack {...args} />;
};

export const Center = Template.bind({});
Center.args = {
  children: (
    <>
      <Stack.CenterLayer>
        <div style={{ background: 'yellow', width: '1em', height: '1em' }} />
      </Stack.CenterLayer>
      <div style={{ background: 'green', height: '4em' }} />
    </>
  ),
};

export const Corners = Template.bind({});
Corners.args = {
  children: (
    <>
      <Stack.Layer top left>
        <p className="dd-text-subtitle1" style={{ background: 'yellow' }}>
          top-left
        </p>
      </Stack.Layer>
      <Stack.Layer top right>
        <p className="dd-text-subtitle1" style={{ background: 'yellow' }}>
          top-right
        </p>
      </Stack.Layer>
      <Stack.Layer bottom left>
        <p className="dd-text-subtitle1" style={{ background: 'yellow' }}>
          bottom-left
        </p>
      </Stack.Layer>
      <Stack.Layer bottom right>
        <p className="dd-text-subtitle1" style={{ background: 'yellow' }}>
          bottom-right
        </p>
      </Stack.Layer>
      <div style={{ background: 'green', height: '4em' }} />
    </>
  ),
};
