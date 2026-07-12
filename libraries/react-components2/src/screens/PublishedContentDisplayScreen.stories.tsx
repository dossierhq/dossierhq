import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { fn, userEvent, within } from 'storybook/test';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { PublishedContentDisplayScreen } from './PublishedContentDisplayScreen.js';

function Wrapper(props: ComponentProps<typeof PublishedContentDisplayScreen>) {
  return (
    <ThemeProvider>
      <StoryDossierProvider>
        <PublishedContentDisplayScreen {...props} />
      </StoryDossierProvider>
    </ThemeProvider>
  );
}

const meta: Meta<typeof Wrapper> = {
  title: 'Screens/PublishedContentDisplayScreen',
  component: Wrapper,
  args: {
    urlSearchParams: new URLSearchParams(),
    onUrlSearchParamsChange: fn(),
  },
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const OpenOpenDialog: Story = {
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText('Open', {}, { timeout: 3_000 }));
  },
};
