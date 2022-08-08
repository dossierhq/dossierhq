import type { FieldSpecification } from '@jonasb/datadata-core';
import { Button, IconButton, Row } from '@jonasb/datadata-design';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useState } from 'react';
import { AdminEntitySelectorDialog } from '../AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { AdminTypePicker } from '../AdminTypePicker/AdminTypePicker.js';
import { INSERT_ADMIN_ENTITY_COMMAND } from './AdminEntityNode.js';
import { INSERT_ADMIN_VALUE_ITEM_COMMAND } from './AdminValueItemNode.js';

export function ToolbarPlugin({ fieldSpec }: { fieldSpec: FieldSpecification }) {
  const [editor] = useLexicalComposerContext();

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const [showSelector, setShowSelector] = useState(false);
  const handleDialogClose = useCallback(() => setShowSelector(false), []);

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
      <Button onClick={() => setShowSelector(true)}>Add entity</Button>
      <AdminTypePicker
        showValueTypes
        valueTypes={fieldSpec.valueTypes}
        onTypeSelected={(type) => editor.dispatchCommand(INSERT_ADMIN_VALUE_ITEM_COMMAND, { type })}
      >
        Add value item
      </AdminTypePicker>
      {showSelector && (
        <AdminEntitySelectorDialog
          show
          title="Select entity"
          entityTypes={fieldSpec.entityTypes}
          onClose={handleDialogClose}
          onItemClick={(entity) => {
            editor.dispatchCommand(INSERT_ADMIN_ENTITY_COMMAND, { id: entity.id });
            setShowSelector(false);
          }}
        />
      )}
    </Row>
  );
}
