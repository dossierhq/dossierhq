import type { Story } from '@storybook/react/types-6-0';
import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';
import React from 'react';
import type { RichTextFieldEditorStoryProps } from './RichTextFieldEditor.stories';
import { default as StoryMeta, Normal } from './RichTextFieldEditor.stories';

function renderStory(
  StoryUnderTest: Story<RichTextFieldEditorStoryProps>,
  overrideArgs?: Partial<RichTextFieldEditorStoryProps>
) {
  const args = {
    ...StoryMeta.args,
    ...StoryUnderTest.args,
    ...overrideArgs,
  } as RichTextFieldEditorStoryProps;
  return <StoryUnderTest {...args} />;
}

async function waitForEditorToInitialize(container: HTMLElement) {
  return act(async () => {
    let continueWaiting = true;
    while (continueWaiting) {
      // eslint-disable-next-line testing-library/no-node-access
      const res = container.querySelectorAll('[data-editorinitialized="false"]');
      if (res.length === 0) {
        continueWaiting = false;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  });
}

describe('RichTextFieldEditor Normal', () => {
  test('renders', async () => {
    let container: HTMLElement | null = null;
    act(() => {
      const { container: renderContainer } = render(renderStory(Normal));
      container = renderContainer;
    });
    if (!container) throw new Error('No container');

    await waitForEditorToInitialize(container);
  });
});
