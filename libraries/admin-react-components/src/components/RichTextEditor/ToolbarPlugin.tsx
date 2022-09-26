import type { AdminFieldSpecification } from '@jonasb/datadata-core';
import { RichTextNodeType } from '@jonasb/datadata-core';
import { ButtonDropdown, IconButton, Row } from '@jonasb/datadata-design';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useContext, useEffect, useState } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { getSelectedNode } from '../../third-party/lexical-playground/utils/getSelectedNode.js';
import { AdminEntitySelectorDialog } from '../AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { AdminTypePickerDialog } from '../AdminTypePickerDialog/AdminTypePickerDialog.js';
import { $isAdminEntityLinkNode, TOGGLE_ADMIN_ENTITY_LINK_COMMAND } from './AdminEntityLinkNode.js';
import { INSERT_ADMIN_ENTITY_COMMAND } from './AdminEntityNode.js';
import { INSERT_ADMIN_VALUE_ITEM_COMMAND } from './AdminValueItemNode.js';

export function ToolbarPlugin({ fieldSpec }: { fieldSpec: AdminFieldSpecification }) {
  const { schema } = useContext(AdminDataDataContext);
  const [editor] = useLexicalComposerContext();

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isEntityLink, setIsEntityLink] = useState(false);

  const [showAddEntityDialog, setShowAddEntityDialog] = useState(false);
  const [showAddValueItemDialog, setShowAddValueItemDialog] = useState(false);

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

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      setIsEntityLink($isAdminEntityLinkNode(parent) || $isAdminEntityLinkNode(node));
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

  const enableAllNodes = !fieldSpec.richTextNodes || fieldSpec.richTextNodes.length === 0;
  const enableEntityNode =
    enableAllNodes || fieldSpec.richTextNodes?.includes(RichTextNodeType.entity);
  const enableEntityLinkNode =
    enableAllNodes || fieldSpec.richTextNodes?.includes(RichTextNodeType.entityLink);
  const enableValueItemNode =
    (enableAllNodes || fieldSpec.richTextNodes?.includes(RichTextNodeType.valueItem)) &&
    schema &&
    schema.getValueTypeCount() > 0;

  const insertItems: { id: string; name: string; show: (show: boolean) => void }[] = [];
  if (enableEntityNode) {
    insertItems.push({ id: 'entity', name: 'Entity', show: setShowAddEntityDialog });
  }
  if (enableValueItemNode) {
    insertItems.push({ id: 'valueItem', name: 'Value item', show: setShowAddValueItemDialog });
  }

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
      {enableEntityLinkNode ? (
        <EntityLinkButton fieldSpec={fieldSpec} isEntityLink={isEntityLink} />
      ) : null}
      {insertItems.length > 0 ? (
        <>
          <Row.Item flexGrow={1} />
          <ButtonDropdown
            iconLeft="add"
            left
            items={insertItems}
            renderItem={(item) => item.name}
            onItemClick={(item) => item.show(true)}
          >
            Insert
          </ButtonDropdown>
        </>
      ) : null}
      {showAddEntityDialog ? (
        <AddEntityDialog fieldSpec={fieldSpec} onClose={() => setShowAddEntityDialog(false)} />
      ) : null}
      {showAddValueItemDialog ? (
        <AddValueItemButton
          fieldSpec={fieldSpec}
          onClose={() => setShowAddValueItemDialog(false)}
        />
      ) : null}
    </Row>
  );
}

function AddEntityDialog({
  fieldSpec,
  onClose,
}: {
  fieldSpec: AdminFieldSpecification;
  onClose: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <AdminEntitySelectorDialog
      show
      title="Select entity"
      entityTypes={fieldSpec.entityTypes}
      onClose={onClose}
      onItemClick={(entity) => {
        editor.dispatchCommand(INSERT_ADMIN_ENTITY_COMMAND, { id: entity.id });
        onClose();
      }}
    />
  );
}

function AddValueItemButton({
  fieldSpec,
  onClose,
}: {
  fieldSpec: AdminFieldSpecification;
  onClose: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <AdminTypePickerDialog
      show
      title="Select value type"
      showValueTypes
      valueTypes={fieldSpec.valueTypes}
      onClose={onClose}
      onItemClick={(type) => {
        editor.dispatchCommand(INSERT_ADMIN_VALUE_ITEM_COMMAND, { type });
        onClose();
      }}
    />
  );
}

function EntityLinkButton({
  fieldSpec,
  isEntityLink,
}: {
  fieldSpec: AdminFieldSpecification;
  isEntityLink: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [showSelector, setShowSelector] = useState(false);
  const handleDialogClose = useCallback(() => setShowSelector(false), []);
  const handleToggleButton = useCallback(
    () =>
      isEntityLink
        ? editor.dispatchCommand(TOGGLE_ADMIN_ENTITY_LINK_COMMAND, null)
        : setShowSelector(true),
    [editor, isEntityLink]
  );

  return (
    <>
      <IconButton icon="link" toggled={isEntityLink} onClick={handleToggleButton} />
      {showSelector && (
        <AdminEntitySelectorDialog
          show
          title="Select entity"
          entityTypes={fieldSpec.entityTypes}
          onClose={handleDialogClose}
          onItemClick={(entity) => {
            editor.dispatchCommand(TOGGLE_ADMIN_ENTITY_LINK_COMMAND, { id: entity.id });
            setShowSelector(false);
          }}
        />
      )}
    </>
  );
}
