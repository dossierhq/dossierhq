import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import type { ComponentProps } from 'react';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { ContentListScreen } from './ContentListScreen.js';

function Wrapper(props: ComponentProps<typeof ContentListScreen>) {
  return (
    <StoryDossierProvider>
      <ContentListScreen {...props} />
    </StoryDossierProvider>
  );
}

const meta = {
  title: 'Screens/ContentListScreen',
  component: Wrapper,
  args: { onOpenEntity: fn(), onUrlSearchParamsChange: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
