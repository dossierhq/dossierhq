import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { Toaster } from '../components/ui/sonner.js';

function Wrapper() {
  // toast('Show me the toast', { duration: Infinity });
  return (
    <ThemeProvider>
      <Toaster />
      <TriggerToast />
    </ThemeProvider>
  );
}

function TriggerToast() {
  useEffect(() => {
    toast('Show me the toast', { duration: Infinity });
  }, []);
  return null;
}

const meta = {
  title: 'Components/Sonner',
  component: Wrapper,
  args: {},
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
