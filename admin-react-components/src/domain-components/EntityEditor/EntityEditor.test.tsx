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
import { TestContextAdapter } from '../../test/TestContextAdapter';
import type { EntityEditorStoryProps } from './EntityEditor.stories';
import { default as StoryMeta, ArchivedFoo, FullFoo, NewFoo } from './EntityEditor.stories';

jest.mock('@editorjs/editorjs');

function renderStory(
  StoryUnderTest: Story<EntityEditorStoryProps>,
  overrideArgs?: Partial<EntityEditorStoryProps>
) {
  const args = {
    ...StoryMeta.args,
    ...StoryUnderTest.args,
    ...overrideArgs,
  } as EntityEditorStoryProps;
  return <StoryUnderTest {...args} />;
}

async function renderStoryToJSON(
  StoryUnderTest: Story<EntityEditorStoryProps>,
  overrideArgs?: Partial<EntityEditorStoryProps>
) {
  let storyRenderer: renderer.ReactTestRenderer | undefined;
  await renderer.act(async () => {
    storyRenderer = renderer.create(renderStory(StoryUnderTest, overrideArgs));
  });
  return storyRenderer?.toJSON();
}

function storyToId(story: Story<EntityEditorStoryProps>, subId: string) {
  const entityId = story.args?.entitySelector?.id;
  expect(entityId).toBeTruthy();
  return `${entityId}-${subId}`;
}

function getByStoryId(story: Story<EntityEditorStoryProps>, subId: string) {
  const id = storyToId(story, subId);
  const result = queryByAttribute('id', document.body, id);
  if (!result) {
    throw getElementError(`No result for id=${id}`, document.body);
  }
  return result;
}

const finders = {
  nameInput: () => screen.getByLabelText('Name') as HTMLInputElement,
  fooTitleInput: () => screen.getByLabelText('title') as HTMLInputElement,
  fooBarButton: (story: Story<EntityEditorStoryProps>) => getByStoryId(story, 'bar'),
  fooBarRemoveButton: (story: Story<EntityEditorStoryProps>) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, testing-library/no-node-access
    const barParent = getByStoryId(story, 'bar').parentElement!;
    return within(barParent).getByTitle('Remove entity');
  },
  fooAnnotatedBarRemoveButton: (story: Story<EntityEditorStoryProps>) => {
    return screen.getByTestId(storyToId(story, 'annotatedBar.remove'));
  },
  fooAnnotatedBarAnnotationInput: (story: Story<EntityEditorStoryProps>) =>
    getByStoryId(story, 'annotatedBar-annotation'),
  fooAnnotatedBarBarButton: (story: Story<EntityEditorStoryProps>) =>
    getByStoryId(story, 'annotatedBar-bar'),
  entityPickerBar1: () => {
    return within(screen.getByRole('dialog')).getByText('Bar: Bar 1');
  },
  entityPickerBar2: () => {
    return within(screen.getByRole('dialog')).getByText('Bar: Bar 2');
  },
  saveButton: () => screen.getByRole('button', { name: /save/i }),
  resetButton: () => screen.getByRole('button', { name: /reset/i }),
};

describe('NewFoo', () => {
  // TODO skip since it causes error log due to wrong act()
  test.skip('render', async () => {
    expect(await renderStoryToJSON(NewFoo)).toMatchSnapshot();
  });

  test('Enter name and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const createEntity = jest.spyOn(contextAdapter, 'createEntity');
    act(() => {
      render(renderStory(NewFoo, { contextAdapter }));
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
            "_version": 0,
            "id": "82ded109-44f2-48b9-a676-43162fda3d7d",
          },
        ],
      ]
    `);
  });

  test('Enter title and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const createEntity = jest.spyOn(contextAdapter, 'createEntity');
    act(() => {
      render(renderStory(NewFoo, { contextAdapter }));
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
            "_version": 0,
            "id": "82ded109-44f2-48b9-a676-43162fda3d7d",
            "title": "New title",
          },
        ],
      ]
    `);
  });

  test('Submit button is disabled when name is empty', async () => {
    await act(async () => {
      render(renderStory(NewFoo));
    });

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

  test('getEntity is not called', async () => {
    const contextAdapter = new TestContextAdapter();
    const getEntity = jest.spyOn(contextAdapter, 'getEntity');
    await act(async () => {
      render(renderStory(NewFoo, { contextAdapter }));
    });

    expect(getEntity.mock.calls).toEqual([]);
  });

  test('getEntity is not called after create (since cached)', async () => {
    const contextAdapter = new TestContextAdapter();
    const getEntity = jest.spyOn(contextAdapter, 'getEntity');
    act(() => {
      render(renderStory(NewFoo, { contextAdapter }));
    });

    getEntity.mockClear();

    userEvent.type(finders.nameInput(), 'New name');

    await act(async () => {
      userEvent.click(finders.saveButton());
    });

    expect(getEntity.mock.calls).toHaveLength(0);
  });
});

describe('FullFoo', () => {
  test('render', async () => {
    expect(await renderStoryToJSON(FullFoo)).toMatchSnapshot();
  });

  test('Enter name and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const updateEntity = jest.spyOn(contextAdapter, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
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
        ],
      ]
    `);
  });

  test('Enter title and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const updateEntity = jest.spyOn(contextAdapter, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
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
        ],
      ]
    `);
  });

  test('Remove Bar entity and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const updateEntity = jest.spyOn(contextAdapter, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
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
        ],
      ]
    `);
  });

  test('Select Bar entity and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const updateEntity = jest.spyOn(contextAdapter, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
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
        ],
      ]
    `);
  });

  test('Remove AnnotatedBar value and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const updateEntity = jest.spyOn(contextAdapter, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
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
        ],
      ]
    `);
  });

  test('Change AnnotatedBar annotation value and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const updateEntity = jest.spyOn(contextAdapter, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
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
        ],
      ]
    `);
  });

  test('Select AnnotatedBar bar value and submit', async () => {
    const contextAdapter = new TestContextAdapter();
    const updateEntity = jest.spyOn(contextAdapter, 'updateEntity');
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
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
        ],
      ]
    `);
  });

  test('Enter name and reset', async () => {
    const contextAdapter = new TestContextAdapter();
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
    });

    const name = finders.nameInput();
    userEvent.clear(name);
    userEvent.type(name, 'New name');
    expect(name.value).toEqual('New name');

    await act(async () => {
      userEvent.click(finders.resetButton());
    });

    expect(name.value).toEqual('Foo 1');
  });

  test('Enter title and reset', async () => {
    const contextAdapter = new TestContextAdapter();
    await act(async () => {
      render(renderStory(FullFoo, { contextAdapter }));
    });

    const fooTitle = finders.fooTitleInput();
    userEvent.clear(fooTitle);
    userEvent.type(fooTitle, 'New title');
    expect(fooTitle.value).toEqual('New title');

    await act(async () => {
      userEvent.click(finders.resetButton());
    });

    expect(fooTitle.value).toEqual('Hello');
  });
});

describe('ArchivedFoo', () => {
  test('render', async () => {
    expect(await renderStoryToJSON(ArchivedFoo)).toMatchSnapshot();
  });
});
