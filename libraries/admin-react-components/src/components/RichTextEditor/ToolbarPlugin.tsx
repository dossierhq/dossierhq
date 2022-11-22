import type { AdminFieldSpecification, RichTextFieldSpecification } from '@jonasb/datadata-core';
import { assertExhaustive, RichTextNodeType } from '@jonasb/datadata-core';
import type { IconName } from '@jonasb/datadata-design';
import { ButtonDropdown, Icon, IconButton, Row, toSpacingClassName } from '@jonasb/datadata-design';
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import type { HeadingTagType } from '@lexical/rich-text';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $wrapNodes } from '@lexical/selection';
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import type { LexicalEditor } from 'lexical';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
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

type BlockTypeName =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'bullet'
  | 'check'
  | 'number';

const blockTypeToBlockName: Record<
  BlockTypeName,
  { title: string; node: RichTextNodeType; icon: IconName }
> = {
  paragraph: { title: 'Paragraph', node: RichTextNodeType.paragraph, icon: 'paragraph' },
  bullet: { title: 'Bulleted list', node: RichTextNodeType.list, icon: 'listUl' },
  number: { title: 'Numbered list', node: RichTextNodeType.list, icon: 'listOl' },
  check: { title: 'Check list', node: RichTextNodeType.list, icon: 'listCheck' },
  h1: { title: 'Heading 1', node: RichTextNodeType.heading, icon: 'heading' },
  h2: { title: 'Heading 2', node: RichTextNodeType.heading, icon: 'heading' },
  h3: { title: 'Heading 3', node: RichTextNodeType.heading, icon: 'heading' },
  h4: { title: 'Heading 4', node: RichTextNodeType.heading, icon: 'heading' },
  h5: { title: 'Heading 5', node: RichTextNodeType.heading, icon: 'heading' },
  h6: { title: 'Heading 6', node: RichTextNodeType.heading, icon: 'heading' },
};
//TODO Could use Typescript 4.9 satisfies to make this more readable

export function ToolbarPlugin({
  fieldSpec,
}: {
  fieldSpec: AdminFieldSpecification<RichTextFieldSpecification>;
}) {
  const { schema } = useContext(AdminDataDataContext);
  const [editor] = useLexicalComposerContext();

  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');

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
      //TODO why can't we only use nodes, why looking at the dom?
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Text formatting
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

      if (elementDOM !== null) {
        // setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }
    }
  }, [editor]);

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
      <BlockFormatDropDown
        disabled={!editor.isEditable()}
        blockType={blockType}
        editor={editor}
        fieldSpec={fieldSpec}
      />
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

function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
  fieldSpec,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
  disabled: boolean;
  fieldSpec: AdminFieldSpecification<RichTextFieldSpecification>;
}): JSX.Element {
  const items: { id: BlockTypeName; name: string; icon: IconName }[] = Object.entries(
    blockTypeToBlockName
  )
    .filter(([_blockType, blockConfig]) => {
      if (!fieldSpec.richTextNodes || fieldSpec.richTextNodes.length === 0) return true;
      return fieldSpec.richTextNodes.includes(blockConfig.node);
    })
    .map(([blockType, blockConfig]) => ({
      id: blockType as keyof typeof blockTypeToBlockName,
      name: blockConfig.title,
      icon: blockConfig.icon,
    }));

  const currentBlockConfig = blockTypeToBlockName[blockType];

  const handleItemClick = useCallback(
    (item: typeof items[number]) => {
      switch (item.id) {
        case 'paragraph':
          if (blockType !== 'paragraph') {
            editor.update(() => {
              const selection = $getSelection();

              if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createParagraphNode());
              }
            });
          }
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': {
          const headingLevel: HeadingTagType = item.id;
          if (blockType !== headingLevel) {
            editor.update(() => {
              const selection = $getSelection();

              if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createHeadingNode(headingLevel));
              }
            });
          }
          break;
        }
        case 'bullet':
          if (blockType !== 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
          break;
        case 'check':
          if (blockType !== 'check') {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
          break;
        case 'number':
          if (blockType !== 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          }
          break;
        default:
          assertExhaustive(item.id);
      }
    },
    [blockType, editor]
  );

  return (
    <ButtonDropdown
      disabled={disabled}
      items={items}
      iconLeft={currentBlockConfig.icon}
      renderItem={(item) => (
        <>
          <Icon
            className={toSpacingClassName({ marginRight: 2, paddingTop: 2 })}
            icon={item.icon}
            size="small"
          />
          {item.name}
        </>
      )}
      onItemClick={handleItemClick}
    >
      {currentBlockConfig.title}
    </ButtonDropdown>
  );
}

function AddEntityDialog({
  fieldSpec,
  onClose,
}: {
  fieldSpec: AdminFieldSpecification<RichTextFieldSpecification>;
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
  fieldSpec: AdminFieldSpecification<RichTextFieldSpecification>;
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
  fieldSpec: AdminFieldSpecification<RichTextFieldSpecification>;
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
          entityTypes={fieldSpec.linkEntityTypes}
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
