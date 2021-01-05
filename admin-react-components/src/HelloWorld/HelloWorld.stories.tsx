import React from 'react';
import { HelloWorld } from './HelloWorld';

export default {
  title: 'Components/HelloWorld',
  component: HelloWorld,
};

export function Normal(): JSX.Element {
  return <HelloWorld />;
}
