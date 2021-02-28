import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { MapContainerProps } from './MapContainer';
import { MapContainer } from './MapContainer';

const defaultArgs: Partial<MapContainerProps> = {
  style: { width: '300px', height: '300px' },
};

export default {
  title: 'Generic/MapContainer',
  component: MapContainer,
  args: defaultArgs,
};

const Template: Story<MapContainerProps> = (args) => {
  return <MapContainer {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const London = Template.bind({});
London.args = { center: { lat: 51.459952, lng: -0.011228 } };
