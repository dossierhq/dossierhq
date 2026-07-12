import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { ChangelogListScreen } from './ChangelogListScreen.js';

function Wrapper(props: ComponentProps<typeof ChangelogListScreen>) {
  return (
    <ThemeProvider>
      <StoryDossierProvider>
        <ChangelogListScreen {...props} />
      </StoryDossierProvider>
    </ThemeProvider>
  );
}

const meta: Meta<typeof Wrapper> = {
  title: 'Screens/ChangelogListScreen',
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
