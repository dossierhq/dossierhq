import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FullscreenContainer } from './FullscreenContainer.js';

const meta = {
  title: 'Components/FullscreenContainer',
  component: FullscreenContainer,
  args: {},
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FullscreenContainer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
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
  },
};

export const StickyRows: Story = {
  args: {
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
  },
};

export const RowTypes: Story = {
  args: {
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
        <FullscreenContainer.ScrollableRow direction="horizontal">
          <FullscreenContainer.Row>
            <div
              style={{
                background:
                  'repeating-linear-gradient(-45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
                width: '300vw',
                height: '100px',
              }}
            />
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      </>
    ),
  },
};

export const RowLayout: Story = {
  args: {
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
  },
};

export const ColumnLayout: Story = {
  args: {
    children: (
      <>
        <FullscreenContainer.Row>
          <div style={{ height: 100, backgroundColor: 'papayawhip' }} />
        </FullscreenContainer.Row>
        <FullscreenContainer.Columns fillHeight>
          <FullscreenContainer.Column gap={5}>
            <p>Gap</p>
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
          </FullscreenContainer.Column>
          <FullscreenContainer.Column flexDirection="row" gap={5}>
            <p>Row with gap</p>
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
          </FullscreenContainer.Column>
          <FullscreenContainer.ScrollableColumn gap={5}>
            <p>Scrollable gap</p>
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
          </FullscreenContainer.ScrollableColumn>
          <FullscreenContainer.ScrollableColumn flexDirection="row" gap={5}>
            <p>Scrollable row with gap</p>
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
            <div style={{ backgroundColor: 'burlywood', height: 10, width: 10 }} />
          </FullscreenContainer.ScrollableColumn>
        </FullscreenContainer.Columns>
        <FullscreenContainer.Row>
          <div style={{ height: 100, backgroundColor: 'papayawhip' }} />
        </FullscreenContainer.Row>
      </>
    ),
  },
};

export const TwoScrollableColumns: Story = {
  args: {
    children: (
      <>
        <FullscreenContainer.Row>
          <div style={{ height: 100, backgroundColor: 'papayawhip' }} />
        </FullscreenContainer.Row>
        <FullscreenContainer.Columns fillHeight>
          <FullscreenContainer.ScrollableColumn width="3/12">
            <div
              style={{
                border: '5px solid burlywood',
                background:
                  'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
                height: '300vh',
              }}
            />
          </FullscreenContainer.ScrollableColumn>
          <FullscreenContainer.ScrollableColumn>
            <div
              style={{
                border: '5px solid burlywood',
                background:
                  'repeating-linear-gradient(-45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
                height: '300vh',
              }}
            />
          </FullscreenContainer.ScrollableColumn>
        </FullscreenContainer.Columns>
        <FullscreenContainer.Row>
          <div style={{ height: 100, backgroundColor: 'papayawhip' }} />
        </FullscreenContainer.Row>
      </>
    ),
  },
};

export const ThreeScrollableColumns: Story = {
  args: {
    children: (
      <>
        <FullscreenContainer.Row>
          <div style={{ height: 100, backgroundColor: 'papayawhip' }} />
        </FullscreenContainer.Row>
        <FullscreenContainer.Columns fillHeight>
          <FullscreenContainer.ScrollableColumn width="3/12">
            <div
              style={{
                border: '5px solid burlywood',
                background:
                  'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
                height: '300vh',
              }}
            />
          </FullscreenContainer.ScrollableColumn>
          <FullscreenContainer.ScrollableColumn>
            <div
              style={{
                border: '5px solid pink',
                background:
                  'repeating-linear-gradient(-45deg, pink, pink 10px, transparent 10px, transparent 40px)',
                height: '300vh',
              }}
            />
          </FullscreenContainer.ScrollableColumn>
          <FullscreenContainer.ScrollableColumn width="3/12">
            <div
              style={{
                border: '5px solid burlywood',
                background:
                  'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
                height: '300vh',
              }}
            />
          </FullscreenContainer.ScrollableColumn>
        </FullscreenContainer.Columns>
        <FullscreenContainer.Row>
          <div style={{ height: 100, backgroundColor: 'papayawhip' }} />
        </FullscreenContainer.Row>
      </>
    ),
  },
};

export const Card: Story = {
  args: {
    card: true,
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
  },
};
