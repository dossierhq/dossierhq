import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { ButtonDropdown } from '../../components/ButtonDropdown/ButtonDropdown.js';
import { IconButton } from '../../components/IconButton/IconButton.js';
import { Row } from '../../components/Row/Row.js';
import { LexicalTheme } from '../../config/LexicalTheme.js';
import { ClassName } from '../../index.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ScreenProps {}

const meta: Meta<ScreenProps> = {
  title: 'Mockups/Rich text editor',
  component: Screen,
  args: {},
  argTypes: {},
  parameters: {},
  tags: ['autodocs'],
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
          <mark className={LexicalTheme.text.highlight}>Highlight</mark>{' '}
          <span className={LexicalTheme.text.strikethrough}>Strikethrough</span>{' '}
          <span className={LexicalTheme.text.underline}>Underline</span>{' '}
          <code className={LexicalTheme.text.code}>Code</code>
        </p>
        <p className={LexicalTheme.paragraph}>
          Second paragraph. H<sup className={LexicalTheme.text.superscript}>2</sup>O
        </p>
        <ul className={LexicalTheme.list.ul}>
          <li className={LexicalTheme.list.listitem}>Item one</li>
          <li className={LexicalTheme.list.listitem}>
            Item two, with line-
            <br />
            break
          </li>
        </ul>
        <p className={LexicalTheme.paragraph}>Ordered list</p>
        <ol className={LexicalTheme.list.ol}>
          <li className={LexicalTheme.list.listitem}>Item one</li>
          <li className={LexicalTheme.list.listitem}>
            Item two, with line-
            <br />
            break
          </li>
        </ol>
        <p className={LexicalTheme.paragraph}>Checked list</p>
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
          <li
            className={toClassName(LexicalTheme.list.listitem, LexicalTheme.list.listitemChecked)}
          >
            Checked item with line-
            <br />
            break
          </li>
        </ul>
        <h1 className={LexicalTheme.heading.h1}>Heading one</h1>
        <h2 className={LexicalTheme.heading.h2}>Heading two</h2>
        <h3 className={LexicalTheme.heading.h3}>Heading three</h3>
        <h4 className={LexicalTheme.heading.h4}>Heading four</h4>
        <h5 className={LexicalTheme.heading.h5}>Heading five</h5>
        <h6 className={LexicalTheme.heading.h6}>Heading six</h6>
        <code
          className={LexicalTheme.code}
          spellCheck="false"
          data-highlight-language="javascript"
          data-gutter="1"
          dir="ltr"
        >
          <span className={LexicalTheme.codeHighlight.attr}>const</span>
          <span> foo </span>
          <span className={LexicalTheme.codeHighlight.operator}>=</span>
          <span> </span>
          <span className={LexicalTheme.codeHighlight.property}>123</span>
          <span className={LexicalTheme.codeHighlight.punctuation}>;</span>
        </code>
      </div>
    </>
  );
}

export const Normal = Template.bind({});
