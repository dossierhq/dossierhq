import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';

interface ScreenProps {
  children: JSX.Element;
}

function Screen({ children }: ScreenProps): JSX.Element {
  return children;
}

const meta: Meta<ScreenProps> = {
  title: 'Screens/Entity list',
  component: Screen,
  args: {},
};
export default meta;

const Template: Story<ScreenProps> = (args) => {
  return (
    <Screen {...args}>
      <section className="hero is-primary">
        <div className="hero-body">
          <p className="title">Hero title</p>
          <p className="subtitle">Hero subtitle</p>
        </div>
      </section>
    </Screen>
  );
};

export const Normal = Template.bind({});
