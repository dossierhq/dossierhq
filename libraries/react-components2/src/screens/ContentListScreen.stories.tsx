import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within } from '@storybook/test';
import type { ComponentProps } from 'react';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { addContentListParamsToURLSearchParams } from '../reducers/ContentListUrlSynchronizer.js';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { ContentListScreen } from './ContentListScreen.js';

function Wrapper(props: ComponentProps<typeof ContentListScreen>) {
  return (
    <ThemeProvider>
      <StoryDossierProvider>
        <ContentListScreen {...props} />
      </StoryDossierProvider>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Screens/ContentListScreen',
  component: Wrapper,
  args: { onOpenEntity: fn(), onCreateEntity: fn(), onUrlSearchParamsChange: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const NoMatches: Story = {
  args: { urlSearchParams: urlFor({ mode: 'full', query: { text: 'no matches' } }) },
};

export const SortedByCreatedAt: Story = {
  args: { urlSearchParams: urlFor({ mode: 'full', query: { order: 'createdAt' } }) },
};

export const SwitchToMap: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle('View map'));
  },
};

export const SwitchToSplit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle('View split'));
  },
};

export const SwitchToSplitAndSelectEntity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle('View split'));

    await userEvent.click(await canvas.findByText('Strings filled'));
  },
};

function urlFor(options: Parameters<typeof addContentListParamsToURLSearchParams>[1]) {
  const payload = new URLSearchParams();
  addContentListParamsToURLSearchParams(payload, options);
  return payload;
}
