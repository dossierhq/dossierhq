import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { MapContainerProps } from './MapContainer';
import { MapContainer } from './MapContainer';

const meta: Meta<MapContainerProps> = {
  title: 'Generic/MapContainer',
  component: MapContainer,
  args: {
    className: 'position-fixed inset-0',
  },
};
export default meta;

const Template: Story<MapContainerProps> = (args) => {
  return <MapContainer {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const London = Template.bind({});
London.args = { center: { lat: 51.459952, lng: -0.011228 } };
