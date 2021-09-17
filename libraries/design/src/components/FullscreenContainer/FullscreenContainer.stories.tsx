import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { FullscreenContainerProps } from './FullscreenContainer';
import { FullscreenContainer } from './FullscreenContainer';

const meta: Meta<FullscreenContainerProps> = {
  title: 'Components/FullscreenContainer',
  component: FullscreenContainer,
  args: {},
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template: Story<FullscreenContainerProps> = (args) => {
  return <FullscreenContainer {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <FullscreenContainer.Row>
        <div style={{ backgroundColor: 'burlywood', height: 100 }} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row scrollable>
        <div
          style={{
            background:
              'repeating-linear-gradient(45deg, burlywood, burlywood 10px, blueviolet 10px, blueviolet 40px)',
            height: '300vh',
          }}
        />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row>
        <div style={{ backgroundColor: 'burlywood', height: 100 }} />
      </FullscreenContainer.Row>
    </>
  ),
};

export const CenterRow = Template.bind({});
CenterRow.args = {
  children: (
    <>
      <FullscreenContainer.Row center>
        <p style={{ backgroundColor: 'burlywood', height: 100, width: 100 }}>Center</p>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row>
        <p style={{ backgroundColor: 'burlywood', height: 100, width: 100 }}>Default</p>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row scrollable>
        <div
          style={{
            background:
              'repeating-linear-gradient(45deg, burlywood, burlywood 10px, blueviolet 10px, blueviolet 40px)',
            height: '300vh',
          }}
        />
      </FullscreenContainer.Row>
    </>
  ),
};
