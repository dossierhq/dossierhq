import type { Meta, Story } from '@storybook/react/types-6-0.js';
import {
  ButtonDropdown,
  ClassName,
  IconButton,
  LexicalTheme,
  Row,
  toClassName,
} from '../../index.js';

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
        <p className={LexicalTheme.paragraph}>
          Lorem <strong className={LexicalTheme.text.bold}>ipsum</strong>.{' '}
          <span className={LexicalTheme.text.strikethrough}>Strikethrough</span>{' '}
          <span className={LexicalTheme.text.underline}>Underline</span>
        </p>
        <p className={LexicalTheme.paragraph}>
          Second paragraph. H<sup className={LexicalTheme.text.superscript}>2</sup>O
        </p>
        <ul className={LexicalTheme.list.ul}>
          <li className={LexicalTheme.list.listitem}>Item one</li>
        </ul>
        <ol className={LexicalTheme.list.ol}>
          <li className={LexicalTheme.list.listitem}>Item one</li>
          <li className={LexicalTheme.list.listitem}>Item two</li>
        </ol>
      </div>
    </>
  );
}

export const Normal = Template.bind({});
