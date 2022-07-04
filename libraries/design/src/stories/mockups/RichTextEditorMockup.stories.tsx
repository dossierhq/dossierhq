import type { Meta, Story } from '@storybook/react/types-6-0.js';
import { ButtonDropdown, ClassName, IconButton, Row, Text, toClassName } from '../../index.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ScreenProps {}

const meta: Meta<ScreenProps> = {
  title: 'Mockups/Rich text editor',
  component: Screen,
  args: {},
  argTypes: {},
  parameters: {},
};
export default meta;

const Template: Story<ScreenProps> = (args) => {
  return <Screen {...args} />;
};

function Screen(): JSX.Element {
  return (
    <>
      <Row gap={2} marginBottom={2}>
        <IconButton.Group condensed skipBottomMargin>
          <IconButton icon="bold" toggled />
          <IconButton icon="italic" />
          <IconButton icon="subscript" toggled />
          <IconButton icon="superscript" />
          <IconButton icon="code" />
          <IconButton icon="underline" />
          <IconButton icon="strikethrough" />
        </IconButton.Group>
        <Row.Item flexGrow={1} />
        <ButtonDropdown
          iconLeft="add"
          left
          items={[
            { id: 'foo', name: 'Foo' },
            { id: 'bar', name: 'Bar' },
          ]}
          renderItem={(it) => it.name}
          onItemClick={(it) => console.log(it)}
        >
          Add entity
        </ButtonDropdown>
        <ButtonDropdown
          iconLeft="add"
          left
          items={[
            { id: 'foo', name: 'Foo' },
            { id: 'bar', name: 'Bar' },
          ]}
          renderItem={(it) => it.name}
          onItemClick={(it) => console.log(it)}
        >
          Add value item
        </ButtonDropdown>
      </Row>
      <div
        className={toClassName(ClassName['rich-text'], ClassName['rich-text-editor'])}
        contentEditable
      >
        <Text textStyle="body1">
          Lorem <strong>ipsum</strong>.
          <span className={ClassName['is-strike-through']}>Strikethrough</span>{' '}
          <span className={ClassName['is-underline']}>Underline</span>
        </Text>
      </div>
    </>
  );
}

export const Normal = Template.bind({});
