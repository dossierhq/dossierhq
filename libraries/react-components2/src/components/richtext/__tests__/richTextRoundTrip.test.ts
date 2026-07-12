import {
  createRichText,
  createRichTextParagraphNode,
  createRichTextTextNode,
  type RichText,
} from '@dossierhq/core';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { createEditor } from 'lexical';
import { describe, expect, test } from 'vitest';
import { ComponentNode } from '../ComponentNode.js';
import { EntityLinkNode } from '../EntityLinkNode.js';
import { EntityNode } from '../EntityNode.js';

function createTestEditor() {
  // Same nodes as RichTextFieldEditor/RichTextFieldDisplay
  return createEditor({
    namespace: 'dossierhq',
    nodes: [
      EntityLinkNode,
      EntityNode,
      ComponentNode,
      CodeNode,
      CodeHighlightNode,
      HeadingNode,
      LinkNode,
      ListItemNode,
      ListNode,
    ],
    onError: (error) => {
      throw error;
    },
  });
}

describe('rich text round-trip', () => {
  test('Dossier JSON -> Lexical editor state -> Dossier JSON', () => {
    const richText = createRichText([
      createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
      createRichTextParagraphNode([
        createRichTextTextNode('Second paragraph, '),
        createRichTextTextNode('bold', { format: ['bold'] }),
      ]),
    ]);

    const editor = createTestEditor();
    const editorState = editor.parseEditorState(richText);
    const serialized = editorState.toJSON() as RichText;

    // everything in the Dossier document survives the round-trip (Lexical may add
    // fields like textFormat/textStyle, so don't require exact equality)
    expect(serialized).toMatchObject(richText);

    // a second round-trip is stable
    const secondSerialized = editor.parseEditorState(serialized).toJSON() as RichText;
    expect(secondSerialized).toEqual(serialized);
  });
});
