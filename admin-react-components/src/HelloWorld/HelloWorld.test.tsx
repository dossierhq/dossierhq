import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { HelloWorld } from './HelloWorld';

test('<HelloWorld/>', () => {
  const tree = renderer.create(<HelloWorld />).toJSON();
  expect(tree).toMatchSnapshot();
});
