import type { Story } from '@storybook/react/types-6-0';
import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import TestContextValue from '../../test/TestContextValue';
import type { ButtonProps } from './Button';
import { default as Default, Normal, Disabled, SubmitLoading } from './Button.stories';

function renderStory(StoryUnderTest: Story<ButtonProps>, overrideArgs?: Partial<ButtonProps>) {
  const args = { ...Default.args, ...StoryUnderTest.args, ...overrideArgs } as ButtonProps;
  return <StoryUnderTest {...args} />;
}

const finders = {
  button: () => screen.getByRole('button'),
};

describe('Normal', () => {
  test('click', async () => {
    const onClick = jest.fn();
    render(renderStory(Normal, { onClick }));

    userEvent.click(finders.button());

    expect(onClick.mock.calls).toHaveLength(1);
  });
});

describe('Disabled', () => {
  test('click', async () => {
    const onClick = jest.fn();
    render(renderStory(Disabled, { onClick }));

    userEvent.click(finders.button());

    expect(onClick.mock.calls).toHaveLength(0);
  });
});

describe('SubmitLoading', () => {
  test('click', async () => {
    const onClick = jest.fn();
    render(renderStory(SubmitLoading, { onClick }));

    userEvent.click(finders.button());

    expect(onClick.mock.calls).toHaveLength(0);
  });
});
