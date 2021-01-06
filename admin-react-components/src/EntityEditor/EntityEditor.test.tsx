import type { Story } from '@storybook/react/types-6-0';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import type { EntityEditorProps } from './EntityEditor';
import { default as Default, DeletedFoo, FullFoo, NewFoo } from './EntityEditor.stories';

function renderStory(
  StoryUnderTest: Story<EntityEditorProps>,
  overrideArgs?: Partial<EntityEditorProps>
) {
  const args = { ...Default.args, ...StoryUnderTest.args, ...overrideArgs } as EntityEditorProps;
  return <StoryUnderTest {...args} />;
}

function renderStoryToJSON(StoryUnderTest: Story<EntityEditorProps>) {
  const args = { ...Default.args, ...StoryUnderTest.args } as EntityEditorProps;
  const tree = renderer.create(<StoryUnderTest {...args} />).toJSON();
  return tree;
}

const finders = {
  getNameInput: () => screen.getByLabelText('Name'),
  getSaveButton: () => screen.getByRole('button', { name: /save/i }),
};

const actions = {
  changeTextInput: (element: HTMLElement, value: string) => {
    fireEvent.change(element, { target: { value } });
  },
};

describe('NewFoo', () => {
  test('render', () => {
    expect(renderStoryToJSON(NewFoo)).toMatchSnapshot();
  });

  test('Enter name and submit', async () => {
    const onSubmit = jest.fn();
    render(renderStory(NewFoo, { onSubmit }));

    const name = finders.getNameInput();
    const submit = finders.getSaveButton();

    actions.changeTextInput(name, 'New name');

    fireEvent.click(submit);

    expect(onSubmit.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "_name": "New name",
          "_type": "Foo",
        },
      ],
    ]
  `);
  });

  test('Submit button is disabled when name is empty', async () => {
    render(renderStory(NewFoo));

    const name = finders.getNameInput();
    const submit = finders.getSaveButton();

    // Is disabled from start
    expect(submit).toBeDisabled();

    // Enabled when name is updated
    actions.changeTextInput(name, 'New name');
    expect(submit).toBeEnabled();

    // Enabled when name is updated
    actions.changeTextInput(name, '');
    expect(submit).toBeDisabled();
  });
});

describe('FullFoo', () => {
  test('render', () => {
    expect(renderStoryToJSON(FullFoo)).toMatchSnapshot();
  });
});

describe('DeletedFoo', () => {
  test('render', () => {
    expect(renderStoryToJSON(DeletedFoo)).toMatchSnapshot();
  });
});
