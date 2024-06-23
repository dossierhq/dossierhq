import type { Meta, StoryObj } from '@storybook/react';
import { fn, screen, userEvent, waitFor, waitForElementToBeRemoved, within } from '@storybook/test';
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
  args: {
    urlSearchParams: new URLSearchParams([
      ['new', 'StringsEntity:e20e9cfc-994a-4115-91bf-2c907f9a87df'],
    ]),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const titleElement = await waitFor(() => canvas.getByLabelText('title'));

    await step('Enter a title', async () => {
      await userEvent.type(titleElement, 'My title');
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
