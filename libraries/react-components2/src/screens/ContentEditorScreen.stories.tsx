import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, waitFor, within } from '@storybook/test';
import type { ComponentProps } from 'react';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { addContentEditorParamsToURLSearchParams } from '../reducers/ContentEditorUrlSynchronizer.js';
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
    urlSearchParams: urlFor({
      entities: [{ type: 'StringsEntity', id: crypto.randomUUID(), isNew: true }],
    }),
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
    urlSearchParams: urlFor({ entities: [{ id: 'a94c056e-7ae4-563c-a8d7-dd7ac41f7929' }] }),
  },
};

export const OneOpenOneNew: Story = {
  args: {
    urlSearchParams: urlFor({
      entities: [
        { id: 'a94c056e-7ae4-563c-a8d7-dd7ac41f7929' },
        { isNew: true, type: 'BooleansEntity', id: 'a40eee5b-1e7f-4323-86d1-f8b14990da74' },
      ],
    }),
  },
};

export const ShowCommandMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle('Show command menu'));

    await new Promise((resolve) => setTimeout(resolve, 200));
  },
};

export const OpenOpenDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByText('Open'));

    await new Promise((resolve) => setTimeout(resolve, 200));
  },
};

export const OpenOpenWithNoMatchesDialog: Story = {
  args: {
    urlSearchParams: urlFor({ query: { text: 'no matches' } }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByText('Open'));

    await new Promise((resolve) => setTimeout(resolve, 200));
  },
};

function urlFor(options: Parameters<typeof addContentEditorParamsToURLSearchParams>[1]) {
  const payload = new URLSearchParams();
  addContentEditorParamsToURLSearchParams(payload, options);
  return payload;
}
