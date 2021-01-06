import type { Story } from '@storybook/react/types-6-0';
import { default as Default, DeletedFoo, FullFoo, NewFoo } from './EntityEditor.stories';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import type { EntityEditorProps } from './EntityEditor';

function renderStory(StoryUnderTest: Story<EntityEditorProps>) {
  const args = { ...Default.args, ...StoryUnderTest.args } as EntityEditorProps;
  const tree = renderer.create(<StoryUnderTest {...args} />).toJSON();
  return tree;
}

test('DeletedFoo', () => {
  expect(renderStory(DeletedFoo)).toMatchSnapshot();
});

test('FullFoo', () => {
  expect(renderStory(FullFoo)).toMatchSnapshot();
});

test('NewFoo', () => {
  expect(renderStory(NewFoo)).toMatchSnapshot();
});
