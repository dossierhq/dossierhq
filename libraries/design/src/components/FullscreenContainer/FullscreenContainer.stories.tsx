import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { FullscreenContainerProps } from './FullscreenContainer.js';
import { FullscreenContainer } from './FullscreenContainer.js';

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
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <div
            style={{
              background:
                'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row>
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
    </>
  ),
};

export const StickyRows = Template.bind({});
StickyRows.args = {
  children: (
    <>
      <FullscreenContainer.Row>
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <div style={{ height: 100 }} />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row sticky>
          <div style={{ height: 100, backgroundColor: 'deeppink' }} />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row>
          <div
            style={{
              background:
                'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '30vh',
            }}
          />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row sticky fullWidth>
          <div style={{ height: 100, backgroundColor: 'greenyellow' }} />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row>
          <div
            style={{
              background:
                'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '100vh',
            }}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row>
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
    </>
  ),
};

export const RowTypes = Template.bind({});
RowTypes.args = {
  children: (
    <>
      <FullscreenContainer.Row fullWidth>
        <p style={{ backgroundColor: 'palevioletred', height: 100 }}>Full width</p>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row>
        <p style={{ backgroundColor: 'burlywood', height: 100, width: 100 }}>Default</p>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row center>
        <p style={{ backgroundColor: 'burlywood', height: 100, width: 100 }}>Center</p>
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <div
            style={{
              background:
                'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </>
  ),
};

export const RowLayout = Template.bind({});
RowLayout.args = {
  children: (
    <>
      <FullscreenContainer.Row paddingLeft={3}>Padding left</FullscreenContainer.Row>
      <FullscreenContainer.Row gap={2}>
        <p>Gap</p>
        <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
        <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row flexDirection="row" gap={2}>
        <p>Row with gap</p>
        <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
        <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
      </FullscreenContainer.Row>
    </>
  ),
};

export const TwoScrollableColumns = Template.bind({});
TwoScrollableColumns.args = {
  children: (
    <>
      <FullscreenContainer.Row>
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn width="3/12">
          <div
            style={{
              background:
                'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn>
          <div
            style={{
              background:
                'repeating-linear-gradient(-45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.ScrollableColumn>
      </FullscreenContainer.Columns>
      <FullscreenContainer.Row>
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
    </>
  ),
};

export const ThreeScrollableColumns = Template.bind({});
ThreeScrollableColumns.args = {
  children: (
    <>
      <FullscreenContainer.Row>
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn width="3/12">
          <div
            style={{
              background:
                'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn>
          <div
            style={{
              background:
                'repeating-linear-gradient(-45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn width="3/12">
          <div
            style={{
              background:
                'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.ScrollableColumn>
      </FullscreenContainer.Columns>
      <FullscreenContainer.Row>
        <div style={{ height: 100 }} />
      </FullscreenContainer.Row>
    </>
  ),
};

