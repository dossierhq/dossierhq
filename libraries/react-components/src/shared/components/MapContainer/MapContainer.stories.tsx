import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { MapContainerProps } from '@dossierhq/leaflet';
import { MapContainer } from '@dossierhq/leaflet';

const meta: Meta<MapContainerProps> = {
  title: 'Shared/MapContainer',
  component: MapContainer,
  args: {
    style: {
      width: '100%',
      height: '100vh',
    },
    center: { lat: 55.60498, lng: 13.003822 },
  },
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template: Story<MapContainerProps> = (args) => {
  return <MapContainer {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const London = Template.bind({});
London.args = { center: { lat: 51.459952, lng: -0.011228 } };

export const LocateControl = Template.bind({});
LocateControl.args = {
  children: <MapContainer.LocateControl />,
};
