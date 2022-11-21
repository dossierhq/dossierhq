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
        <ul className={LexicalTheme.list.ul}>
          <li
            className={toClassName(LexicalTheme.list.listitem, LexicalTheme.list.listitemUnchecked)}
          >
            Unchecked item
          </li>
          <li
            className={toClassName(LexicalTheme.list.listitem, LexicalTheme.list.listitemChecked)}
          >
            Checked item
          </li>
        </ul>
        <h1 className={LexicalTheme.heading.h1}>Heading one</h1>
        <h2 className={LexicalTheme.heading.h2}>Heading two</h2>
        <h3 className={LexicalTheme.heading.h3}>Heading three</h3>
        <h4 className={LexicalTheme.heading.h4}>Heading four</h4>
        <h5 className={LexicalTheme.heading.h5}>Heading five</h5>
        <h6 className={LexicalTheme.heading.h6}>Heading six</h6>
      </div>
    </>
  );
}

export const Normal = Template.bind({});
