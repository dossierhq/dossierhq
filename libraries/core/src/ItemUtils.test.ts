import { describe, expect, test } from 'vitest';
import {
  copyEntity,
  isEntityNameAsRequested,
  isFieldValueEqual,
  isRichTextCodeHighlightNode,
  isRichTextCodeNode,
  isRichTextEntityLinkNode,
  isRichTextEntityNode,
  isRichTextHeadingNode,
  isRichTextLineBreakNode,
  isRichTextLinkNode,
  isRichTextListItemNode,
  isRichTextListNode,
  isRichTextParagraphNode,
  isRichTextTabNode,
  isRichTextTextNode,
  isRichTextValueItemNode,
} from './ItemUtils.js';
import type { AdminEntity, AdminEntityCreate, RichText, RichTextNode, ValueItem } from './Types.js';

type AdminFoo = AdminEntity<'Foo', AdminFooFields, 'none'>;

interface AdminFooFields {
  string: string | null;
  stringList: string[] | null;
  twoStrings: AdminTwoStrings | null;
  richText: RichText | null;
}

type AdminTwoStrings = ValueItem<'TwoStrings', AdminTwoStringsFields>;

interface AdminTwoStringsFields {
  string1: string | null;
  string2: string | null;
}

describe('copyEntity', () => {
  test('AdminEntityCreate with app type', () => {
    const entity: AdminEntityCreate<AdminFoo> = {
      info: { type: 'Foo', authKey: 'none', name: 'Name' },
      fields: { string: 'hello' },
    };
    const copy: AdminEntityCreate<AdminFoo> = copyEntity(entity, {
      fields: { stringList: ['world'] },
    });
    expect(copy).toEqual({
      info: { authKey: 'none', name: 'Name', type: 'Foo' },
      fields: { string: 'hello', stringList: ['world'] },
    });
  });
});

describe('isEntityNameAsRequested', () => {
  test('hello=hello', () => expect(isEntityNameAsRequested('hello', 'hello')).toBeTruthy());
  test('hello#123=hello', () => expect(isEntityNameAsRequested('hello#123', 'hello')).toBeTruthy());
  test('hello#123=hello#123', () =>
    expect(isEntityNameAsRequested('hello#123', 'hello#123')).toBeTruthy());

  test('hello!=world', () => expect(isEntityNameAsRequested('hello', 'world')).toBeFalsy());
  test('hello#456!=hello#123', () =>
    expect(isEntityNameAsRequested('hello#456', 'hello#123')).toBeFalsy());
});

describe('isFieldValueEqual', () => {
  test('string===string', () => expect(isFieldValueEqual('hello', 'hello')).toBeTruthy());
  test('string!==null', () => expect(isFieldValueEqual('hello', null)).toBeFalsy());
  test('string!==other string', () => expect(isFieldValueEqual('hello', 'world')).toBeFalsy());
  test('string[]===string[]', () =>
    expect(isFieldValueEqual(['hello', 'world'], ['hello', 'world'])).toBeTruthy());
  test('string[]!==string[] (order)', () =>
    expect(isFieldValueEqual(['hello', 'world'], ['world', 'hello'])).toBeFalsy());

  test('value item===value item', () =>
    expect(
      isFieldValueEqual(
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
      ),
    ).toBeTruthy());

  test('value item!==value item', () =>
    expect(
      isFieldValueEqual(
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'DIFFERENCE'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
      ),
    ).toBeFalsy());
});

describe('isRichTextXxxNode', () => {
  test('all', () => {
    // checking that all the 'leaf' types are covered and are distinct
    const node: RichTextNode = { type: 'any', version: 1 };
    if (isRichTextTextNode(node)) {
      const _type: 'text' = node.type;
    } else if (isRichTextLineBreakNode(node)) {
      const _type: 'linebreak' = node.type;
    } else if (isRichTextTabNode(node)) {
      const _type: 'tab' = node.type;
    } else if (isRichTextParagraphNode(node)) {
      const _type: 'paragraph' = node.type;
    } else if (isRichTextEntityNode(node)) {
      const _type: 'entity' = node.type;
    } else if (isRichTextEntityLinkNode(node)) {
      const _type: 'entityLink' = node.type;
    } else if (isRichTextValueItemNode(node)) {
      const _type: 'valueItem' = node.type;
    } else if (isRichTextCodeNode(node)) {
      const _type: 'code' = node.type;
    } else if (isRichTextCodeHighlightNode(node)) {
      const _type: 'code-highlight' = node.type;
    } else if (isRichTextHeadingNode(node)) {
      const _type: 'heading' = node.type;
    } else if (isRichTextLinkNode(node)) {
      const _type: 'link' = node.type;
    } else if (isRichTextListNode(node)) {
      const _type: 'list' = node.type;
    } else if (isRichTextListItemNode(node)) {
      const _type: 'listitem' = node.type;
    }
  });
});
