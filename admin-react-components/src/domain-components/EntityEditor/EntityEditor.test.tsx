import type { Story } from '@storybook/react/types-6-0';
import '@testing-library/jest-dom';
import {
  act,
  getElementError,
  queryByAttribute,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import TestContextValue from '../../test/TestContextValue';
import type { EntityEditorProps } from './EntityEditor';
import { default as Default, DeletedFoo, FullFoo, NewFoo } from './EntityEditor.stories';

function renderStory(
  StoryUnderTest: Story<EntityEditorProps & { contextValue?: TestContextValue }>,
  overrideArgs?: Partial<EntityEditorProps & { contextValue?: TestContextValue }>
) {
  const args = { ...Default.args, ...StoryUnderTest.args, ...overrideArgs } as EntityEditorProps;
  return <StoryUnderTest {...args} />;
}

async function renderStoryToJSON(
  StoryUnderTest: Story<EntityEditorProps & { contextValue?: TestContextValue }>,
  overrideArgs?: Partial<EntityEditorProps & { contextValue?: TestContextValue }>
) {
  let storyRenderer: renderer.ReactTestRenderer | undefined;
  await renderer.act(async () => {
    storyRenderer = renderer.create(renderStory(StoryUnderTest, overrideArgs));
  });
  return storyRenderer?.toJSON();
}

function storyToId(story: Story<EntityEditorProps>, subId: string) {
  let idPrefix = story.args?.idPrefix;
  if (!idPrefix && story.args?.entity && 'id' in story.args.entity) {
    idPrefix = `entity-${story.args.entity.id}`;
  }
  expect(idPrefix).toBeTruthy();
  return `${idPrefix}-${subId}`;
}

function getByStoryId(story: Story<EntityEditorProps>, subId: string) {
  const id = storyToId(story, subId);
  const result = queryByAttribute('id', document.body, id);
  if (!result) {
    throw getElementError(`No result for id=${id}`, document.body);
  }
  return result;
}

const finders = {
  nameInput: () => screen.getByLabelText('Name'),
  fooTitleInput: () => screen.getByLabelText('title'),
  fooBarButton: (story: Story<EntityEditorProps>) => getByStoryId(story, 'bar'),
  fooBarRemoveButton: (story: Story<EntityEditorProps>) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const barParent = getByStoryId(story, 'bar').parentElement!;
    return within(barParent).getByTitle('Remove entity');
  },
  fooAnnotatedBarRemoveButton: (story: Story<EntityEditorProps>) => {
    return screen.getByTestId(storyToId(story, 'annotatedBar.remove'));
  },
  fooAnnotatedBarAnnotationInput: (story: Story<EntityEditorProps>) =>
    getByStoryId(story, 'annotatedBar-annotation'),
  fooAnnotatedBarBarButton: (story: Story<EntityEditorProps>) =>
    getByStoryId(story, 'annotatedBar-bar'),
  entityPickerBar1: () => {
    return within(screen.getByRole('dialog')).getByText('Bar 1');
  },
  entityPickerBar2: () => {
    return within(screen.getByRole('dialog')).getByText('Bar 2');
  },
  saveButton: () => screen.getByRole('button', { name: /save/i }),
};

describe('NewFoo', () => {
  test('render', async () => {
    expect(await renderStoryToJSON(NewFoo)).toMatchSnapshot();
  });

  test('Enter name and submit', async () => {
    const contextValue = new TestContextValue();
    const createEntity = jest.spyOn(contextValue, 'createEntity');
    act(() => {
      render(renderStory(NewFoo, { contextValue }));
    });

    const name = finders.nameInput();
    userEvent.type(name, 'New name');

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(createEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_name": "New name",
            "_type": "Foo",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });

  test('Enter title and submit', async () => {
    const contextValue = new TestContextValue();
    const createEntity = jest.spyOn(contextValue, 'createEntity');
    act(() => {
      render(renderStory(NewFoo, { contextValue }));
    });

    userEvent.type(finders.nameInput(), 'New name'); // TODO remove, update automatically
    userEvent.type(finders.fooTitleInput(), 'New title');

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(createEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_name": "New name",
            "_type": "Foo",
            "title": "New title",
          },
          Object {
            "publish": true,
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
    userEvent.type(name, 'New name');
    expect(submit).toBeEnabled();

    // Enabled when name is updated
    userEvent.clear(name);
    expect(submit).toBeDisabled();
  });
});

describe('FullFoo', () => {
  test('render', async () => {
    expect(await renderStoryToJSON(FullFoo)).toMatchSnapshot();
  });

  test('Enter name and submit', async () => {
    const contextValue = new TestContextValue();
    const updateEntity = jest.spyOn(contextValue, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextValue }));
    });

    const name = finders.nameInput();
    userEvent.clear(name);
    userEvent.type(name, 'New name');

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(updateEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_name": "New name",
            "_type": "Foo",
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });

  test('Enter title and submit', async () => {
    const contextValue = new TestContextValue();
    const updateEntity = jest.spyOn(contextValue, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextValue }));
    });

    const fooTitle = finders.fooTitleInput();
    userEvent.clear(fooTitle);
    userEvent.type(fooTitle, 'New title');

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(updateEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_type": "Foo",
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
            "title": "New title",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });

  test('Remove Bar entity and submit', async () => {
    const contextValue = new TestContextValue();
    const updateEntity = jest.spyOn(contextValue, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextValue }));
    });

    userEvent.click(finders.fooBarRemoveButton(FullFoo));

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(updateEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_type": "Foo",
            "bar": null,
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });

  test('Select Bar entity and submit', async () => {
    const contextValue = new TestContextValue();
    const updateEntity = jest.spyOn(contextValue, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextValue }));
    });

    const bar = finders.fooBarButton(FullFoo);
    userEvent.click(bar);

    const bar2 = await waitFor(() => finders.entityPickerBar2());
    userEvent.click(bar2);

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(updateEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_type": "Foo",
            "bar": Object {
              "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
            },
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });

  test('Remove AnnotatedBar value and submit', async () => {
    const contextValue = new TestContextValue();
    const updateEntity = jest.spyOn(contextValue, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextValue }));
    });

    userEvent.click(finders.fooAnnotatedBarRemoveButton(FullFoo));

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(updateEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_type": "Foo",
            "annotatedBar": null,
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });

  test('Change AnnotatedBar annotation value and submit', async () => {
    const contextValue = new TestContextValue();
    const updateEntity = jest.spyOn(contextValue, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextValue }));
    });

    const annotation = finders.fooAnnotatedBarAnnotationInput(FullFoo);
    userEvent.clear(annotation);
    userEvent.type(annotation, 'New annotation');

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(updateEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_type": "Foo",
            "annotatedBar": Object {
              "_type": "AnnotatedBar",
              "annotation": "New annotation",
              "bar": Object {
                "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
              },
            },
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });

  test('Select AnnotatedBar bar value and submit', async () => {
    const contextValue = new TestContextValue();
    const updateEntity = jest.spyOn(contextValue, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextValue }));
    });

    userEvent.click(finders.fooAnnotatedBarBarButton(FullFoo));

    const bar1 = await waitFor(() => finders.entityPickerBar1());
    userEvent.click(bar1);

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(updateEntity.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "_type": "Foo",
            "annotatedBar": Object {
              "_type": "AnnotatedBar",
              "annotation": "Annotation",
              "bar": Object {
                "id": "cb228716-d3dd-444f-9a77-80443d436339",
              },
            },
            "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          },
          Object {
            "publish": true,
          },
        ],
      ]
    `);
  });
});

describe('DeletedFoo', () => {
  test('render', async () => {
    expect(await renderStoryToJSON(DeletedFoo)).toMatchSnapshot();
  });
});
