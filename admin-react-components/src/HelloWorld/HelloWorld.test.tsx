import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { Normal } from './HelloWorld.stories';

test('Normal', () => {
  const tree = renderer.create(<Normal />).toJSON();
  expect(tree).toMatchSnapshot();
});
