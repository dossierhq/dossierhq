import { MapContainer } from '@dossierhq/leaflet';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta = {
  title: 'Components/MapContainer',
  component: MapContainer,
  args: {
    style: {
      width: '100%',
      height: '100vh',
    },
    center: { lat: 55.60498, lng: 13.003822 },
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof MapContainer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const London: Story = { args: { center: { lat: 51.459952, lng: -0.011228 } } };

export const LocateControl: Story = {
  args: {
    children: <MapContainer.LocateControl />,
  },
};

export const LocateControlAutoStart: Story = {
  args: {
    children: <MapContainer.LocateControl autoStart />,
  },
};
