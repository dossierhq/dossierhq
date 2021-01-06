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

function renderStoryToJSON(
  StoryUnderTest: Story<EntityEditorProps>,
  overrideArgs?: Partial<EntityEditorProps>
) {
  return renderer.create(renderStory(StoryUnderTest, overrideArgs)).toJSON();
}

const finders = {
  nameInput: () => screen.getByLabelText('Name'),
  fooTitleInput: () => screen.getByLabelText('title'),
  saveButton: () => screen.getByRole('button', { name: /save/i }),
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

    const name = finders.nameInput();
    const submit = finders.saveButton();

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

  test('Enter title and submit', async () => {
    const onSubmit = jest.fn();
    render(renderStory(NewFoo, { onSubmit }));

    actions.changeTextInput(finders.nameInput(), 'New name'); // TODO remove, update automatically
    actions.changeTextInput(finders.fooTitleInput(), 'New title');

    fireEvent.click(finders.saveButton());

    expect(onSubmit.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_name": "New name",
            "_type": "Foo",
            "title": "New title",
          },
        ],
      ]
    `);
  });

  test('Submit button is disabled when name is empty', async () => {
    render(renderStory(NewFoo));

    const name = finders.nameInput();
    const submit = finders.saveButton();

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

  test('Enter name and submit', async () => {
    const onSubmit = jest.fn();
    render(renderStory(FullFoo, { onSubmit }));

    actions.changeTextInput(finders.nameInput(), 'New name');

    fireEvent.click(finders.saveButton());

    expect(onSubmit.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_name": "New name",
            "_type": "Foo",
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          },
        ],
      ]
    `);
  });

  test('Enter title and submit', async () => {
    const onSubmit = jest.fn();
    render(renderStory(FullFoo, { onSubmit }));

    actions.changeTextInput(finders.fooTitleInput(), 'New title');

    fireEvent.click(finders.saveButton());

    expect(onSubmit.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_type": "Foo",
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
            "title": "New title",
          },
        ],
      ]
    `);
  });
});

describe('DeletedFoo', () => {
  test('render', () => {
    expect(renderStoryToJSON(DeletedFoo)).toMatchSnapshot();
  });
});
