import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, waitFor, waitForElementToBeRemoved, within } from '@storybook/test';
import type { ComponentProps } from 'react';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { ContentEditorScreen } from './ContentEditorScreen.js';

function Wrapper(props: ComponentProps<typeof ContentEditorScreen>) {
  return (
    <ThemeProvider>
      <StoryDossierProvider>
        <ContentEditorScreen {...props} />
      </StoryDossierProvider>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Screens/ContentEditorScreen',
  component: Wrapper,
  args: {
    urlSearchParams: new URLSearchParams(),
    onUrlSearchParamsChange: fn(),
    onEditorHasChangesChange: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const CreateStringsEntity: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open create dialog', async () => {
      const createButtonElement = await waitFor(() => canvas.getByText('Create'));
      await userEvent.click(createButtonElement);
    });

    await step('Select StringsEntity', async () => {
      const dialogElement = document.querySelector('[role="dialog"]');
      if (!dialogElement || !(dialogElement instanceof HTMLElement)) {
        throw new Error('Dialog not found');
      }
      const dialog = within(dialogElement);

      await userEvent.type(dialog.getByRole('combobox'), 'StringsEntity');
      await userEvent.keyboard('{Enter}');

      await waitForElementToBeRemoved(dialogElement);
    });

    await step('Enter a title', async () => {
      await userEvent.type(canvas.getByLabelText('title'), 'My title');
    });
  },
};

export const OneOpen: Story = {
  args: {
    urlSearchParams: urlFor(['a94c056e-7ae4-563c-a8d7-dd7ac41f7929']),
  },
};

function urlFor(ids: string[]) {
  return new URLSearchParams(ids.map((id) => ['id', id]));
}
