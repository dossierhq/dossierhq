import { Button } from '@/components/ui/button';
import type { Meta, StoryObj } from '@storybook/react';

function Placeholder() {
  return (
    <div>
      <Button>Placeholder</Button>
    </div>
  );
}

const meta = {
  title: 'Placeholder',
  component: Placeholder,
  argTypes: {},
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Placeholder>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
