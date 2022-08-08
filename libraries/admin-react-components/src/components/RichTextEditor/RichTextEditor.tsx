import type { FieldSpecification, RichText } from '@jonasb/datadata-core';
import { Button, ClassName, IconButton, Row, toClassName } from '@jonasb/datadata-design';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { mergeRegister } from '@lexical/utils';
import type { EditorState, LexicalEditor } from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LexicalTheme } from '../../utils/LexicalTheme.js';
import { AdminTypePicker } from '../AdminTypePicker/AdminTypePicker.js';
import { AdminEntityNode, INSERT_ADMIN_ENTITY_COMMAND } from './AdminEntityNode.js';
import { AdminValueItemNode, INSERT_ADMIN_VALUE_ITEM_COMMAND } from './AdminValueItemNode.js';
import { EntityPlugin } from './EntityPlugin.js';
import { RichTextEditorContext } from './RichTextEditorContext.js';
import { ValueItemPlugin } from './ValueItemPlugin.js';

interface Props {
  fieldSpec: FieldSpecification;
  value: RichText | null;
  onChange: (value: RichText | null) => void;
}

export function RichTextEditor({ fieldSpec, value, onChange }: Props) {
  const debouncedHandleChange = useMemo(
    () =>
      debounce((editorState: EditorState) => {
        const json = editorState.toJSON();
        onChange(json);
      }, 500),
    [onChange]
  );
  useEffect(() => {
    return () => debouncedHandleChange.cancel();
  }, [debouncedHandleChange]);

  const initialConfig = {
    namespace: 'datadata',
    onError: handleError,
    nodes: [AdminEntityNode, AdminValueItemNode],
    theme: LexicalTheme,
    editorState: value
      ? (editor: LexicalEditor) => {
          const state = editor.parseEditorState(value);
          editor.setEditorState(state);
        }
      : undefined,
  };

  return (
    <RichTextEditorContext.Provider value={{ fieldSpec }}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={toClassName(ClassName['rich-text'], ClassName['rich-text-editor'])}
            />
          }
          placeholder=""
        />
        <EntityPlugin />
        <ValueItemPlugin />
        <OnChangePlugin onChange={debouncedHandleChange} />
      </LexicalComposer>
    </RichTextEditorContext.Provider>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [editor, updateToolbar]);

  return (
    <Row gap={2} marginBottom={2}>
      <IconButton.Group condensed skipBottomMargin>
        <IconButton
          icon="bold"
          toggled={isBold}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        />
        <IconButton
          icon="italic"
          toggled={isItalic}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        />
        <IconButton
          icon="subscript"
          toggled={isSubscript}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')}
        />
        <IconButton
          icon="superscript"
          toggled={isSuperscript}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')}
        />
        <IconButton
          icon="code"
          toggled={isCode}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        />
        <IconButton
          icon="underline"
          toggled={isUnderline}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        />
        <IconButton
          icon="strikethrough"
          toggled={isStrikethrough}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        />
      </IconButton.Group>
      <Row.Item flexGrow={1} />
      <Button onClick={() => editor.dispatchCommand(INSERT_ADMIN_ENTITY_COMMAND, undefined)}>
        Add entity
      </Button>
      <AdminTypePicker
        showValueTypes
        onTypeSelected={(type) => editor.dispatchCommand(INSERT_ADMIN_VALUE_ITEM_COMMAND, { type })}
      >
        Add value item
      </AdminTypePicker>
    </Row>
  );
}

function handleError(error: Error) {
  console.error(error);
}
