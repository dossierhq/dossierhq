import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
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

export const Map: Story = {
  args: {
    urlSearchParams: urlFor({
      mode: 'full',
      query: {
        boundingBox: {
          minLat: 55.48663527739911,
          minLng: 12.558059692382814,
          maxLat: 55.73058999769508,
          maxLng: 13.509063720703125,
        },
      },
    }),
  },
};

function urlFor(options: Parameters<typeof addContentListParamsToURLSearchParams>[1]) {
  const payload = new URLSearchParams();
  addContentListParamsToURLSearchParams(payload, options);
  return payload;
}
