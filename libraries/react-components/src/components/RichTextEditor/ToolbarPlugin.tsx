import {
  RichTextNodeType,
  type FieldSpecification,
  type RichTextFieldSpecification,
} from '@dossierhq/core';
import {
  ButtonDropdown,
  Dialog2,
  Icon,
  IconButton,
  Row,
  toSpacingClassName,
  type IconName,
} from '@dossierhq/design';
import {
  $createCodeNode,
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
  getLanguageFriendlyName,
} from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $createHeadingNode, $isHeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
  type NodeKey,
} from 'lexical';
import { useCallback, useContext, useEffect, useState } from 'react';
import { DossierContext } from '../../contexts/DossierContext.js';
import { getSelectedNode } from '../../third-party/lexical-playground/utils/getSelectedNode.js';
import { assertExhaustive } from '../../utils/AssertUtils.js';
import { AdminEntitySelectorDialog } from '../AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { AdminTypePickerDialog } from '../AdminTypePickerDialog/AdminTypePickerDialog.js';
import { INSERT_ADMIN_COMPONENT_COMMAND } from './AdminComponentNode.js';
import { $isAdminEntityLinkNode, TOGGLE_ADMIN_ENTITY_LINK_COMMAND } from './AdminEntityLinkNode.js';
import { INSERT_ADMIN_ENTITY_COMMAND } from './AdminEntityNode.js';
import { CreateLinkDialog } from './CreateLinkDialog.js';

const blockTypeToBlockName = {
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
  code: { title: 'Code block', node: RichTextNodeType.code, icon: 'code' },
} satisfies Record<string, { title: string; node: RichTextNodeType; icon: IconName }>;

type BlockTypeName = keyof typeof blockTypeToBlockName;

export function ToolbarPlugin({ fieldSpec }: { fieldSpec: RichTextFieldSpecification }) {
  const { schema } = useContext(DossierContext);
  const [editor] = useLexicalComposerContext();

  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);

  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isEntityLink, setIsEntityLink] = useState(false);

  const [codeLanguage, setCodeLanguage] = useState<string>('');

  const [showAddEntityDialog, setShowAddEntityDialog] = useState(false);
  const [showAddComponentDialog, setShowAddComponentDialog] = useState(false);

  const $updateToolbar = useCallback(() => {
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
      setIsLink($isLinkNode(parent) || $isLinkNode(node));
      setIsEntityLink($isAdminEntityLinkNode(parent) || $isAdminEntityLinkNode(node));

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
          if ($isCodeNode(element)) {
            const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            setCodeLanguage(language ? CODE_LANGUAGE_MAP[language] || language : '');
            return; //TODO why return here?
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
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
    );
  }, [editor, $updateToolbar]);

  const enableAllNodes = !fieldSpec.richTextNodes || fieldSpec.richTextNodes.length === 0;
  const enableEntityNode =
    enableAllNodes || fieldSpec.richTextNodes?.includes(RichTextNodeType.entity);
  const enableLinkNode = enableAllNodes || fieldSpec.richTextNodes?.includes(RichTextNodeType.link);
  const enableEntityLinkNode =
    enableAllNodes || fieldSpec.richTextNodes?.includes(RichTextNodeType.entityLink);
  const enableComponentNode =
    (enableAllNodes || fieldSpec.richTextNodes?.includes(RichTextNodeType.component)) &&
    schema &&
    schema.getComponentTypeCount() > 0;

  const insertItems: { id: string; name: string; show: (show: boolean) => void }[] = [];
  if (enableEntityNode) {
    insertItems.push({ id: 'entity', name: 'Entity', show: setShowAddEntityDialog });
  }
  if (enableComponentNode) {
    insertItems.push({ id: 'component', name: 'Component', show: setShowAddComponentDialog });
  }

  return (
    <Row gap={2} marginBottom={2}>
      <BlockFormatDropDown
        disabled={!editor.isEditable()}
        blockType={blockType}
        editor={editor}
        fieldSpec={fieldSpec}
      />
      {blockType === 'code' ? (
        <CodeLanguageDropdown
          disabled={!editor.isEditable()}
          editor={editor}
          codeLanguage={codeLanguage}
          selectedElementKey={selectedElementKey}
        />
      ) : (
        <>
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
          {enableEntityLinkNode || enableLinkNode ? (
            <LinkAndEntityLinkButton
              fieldSpec={fieldSpec}
              enableEntityLinkNode={enableEntityLinkNode}
              enableLinkNode={enableLinkNode}
              isEntityLink={isEntityLink}
              isLink={isLink}
            />
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
        </>
      )}
      {showAddEntityDialog ? (
        <AddEntityDialog fieldSpec={fieldSpec} onClose={() => setShowAddEntityDialog(false)} />
      ) : null}
      {showAddComponentDialog ? (
        <AddComponentButton
          fieldSpec={fieldSpec}
          onClose={() => setShowAddComponentDialog(false)}
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
  fieldSpec: RichTextFieldSpecification;
}): JSX.Element {
  const items: { id: BlockTypeName; name: string; icon: IconName }[] = Object.entries(
    blockTypeToBlockName,
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
    (item: (typeof items)[number]) => {
      const formatParagraph = () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        });
      };

      switch (item.id) {
        case 'paragraph':
          formatParagraph();
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': {
          // Corresponds to formatHeading() in Playground
          const headingLevel: HeadingTagType = item.id;
          if (blockType !== headingLevel) {
            editor.update(() => {
              const selection = $getSelection();
              $setBlocksType(selection, () => $createHeadingNode(headingLevel));
            });
          }
          break;
        }
        case 'bullet':
          if (blockType !== 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
            formatParagraph();
          }
          break;
        case 'check':
          if (blockType !== 'check') {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
          } else {
            formatParagraph();
          }
          break;
        case 'number':
          if (blockType !== 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          } else {
            formatParagraph();
          }
          break;
        case 'code':
          if (blockType !== 'code') {
            editor.update(() => {
              let selection = $getSelection();

              if ($isRangeSelection(selection)) {
                if (selection.isCollapsed()) {
                  $setBlocksType(selection, () => $createCodeNode());
                } else {
                  const textContent = selection.getTextContent();
                  const codeNode = $createCodeNode();
                  selection.insertNodes([codeNode]);
                  selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    selection.insertRawText(textContent);
                  }
                }
              }
            });
          }
          break;
        default:
          assertExhaustive(item.id);
      }
    },
    [blockType, editor],
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

function CodeLanguageDropdown({
  disabled,
  codeLanguage,
  editor,
  selectedElementKey,
}: {
  disabled: boolean;
  codeLanguage: string;
  editor: LexicalEditor;
  selectedElementKey: string | null;
}) {
  const items = Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(([value, name]) => ({
    id: value,
    name,
  }));

  const handleItemClick = useCallback(
    (item: (typeof items)[number]) => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(item.id);
          }
        }
      });
    },
    [editor, selectedElementKey],
  );

  return (
    <ButtonDropdown
      disabled={disabled}
      items={items}
      renderItem={(it) => it.name}
      activeItemIds={[codeLanguage]}
      onItemClick={handleItemClick}
    >
      {getLanguageFriendlyName(codeLanguage)}
    </ButtonDropdown>
  );
}

function AddEntityDialog({
  fieldSpec,
  onClose,
}: {
  fieldSpec: RichTextFieldSpecification;
  onClose: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <Dialog2.Trigger defaultOpen={true} onOpenChange={onClose}>
      <AdminEntitySelectorDialog
        title="Select entity"
        entityTypes={fieldSpec.entityTypes}
        onItemClick={(entity) => {
          editor.dispatchCommand(INSERT_ADMIN_ENTITY_COMMAND, { id: entity.id });
          onClose();
        }}
      />
    </Dialog2.Trigger>
  );
}

function AddComponentButton({
  fieldSpec,
  onClose,
}: {
  fieldSpec: RichTextFieldSpecification;
  onClose: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <Dialog2.Trigger defaultOpen={true} onOpenChange={onClose}>
      <AdminTypePickerDialog
        title="Select component type"
        showComponentTypes
        componentTypes={fieldSpec.componentTypes}
        onItemClick={(type) => {
          editor.dispatchCommand(INSERT_ADMIN_COMPONENT_COMMAND, { type });
          onClose();
        }}
      />
    </Dialog2.Trigger>
  );
}

function LinkAndEntityLinkButton({
  fieldSpec,
  enableLinkNode,
  enableEntityLinkNode,
  isLink,
  isEntityLink,
}: {
  fieldSpec: RichTextFieldSpecification;
  enableLinkNode: boolean;
  enableEntityLinkNode: boolean;
  isLink: boolean;
  isEntityLink: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [openDialog, setOpenDialog] = useState<'link' | 'entity' | null>(null);

  const handleOpenChanged = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setOpenDialog(null);
    }
  }, []);

  const handleToggleButton = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else if (isEntityLink) {
      editor.dispatchCommand(TOGGLE_ADMIN_ENTITY_LINK_COMMAND, null);
    } else if (enableLinkNode && enableEntityLinkNode) {
      setOpenDialog('link');
    } else if (enableLinkNode) {
      showLinkPrompt(editor);
    } else if (enableEntityLinkNode) {
      setOpenDialog('entity');
    }
  }, [editor, enableEntityLinkNode, enableLinkNode, isEntityLink, isLink]);

  return (
    <Dialog2.Trigger isOpen={openDialog !== null} onOpenChange={handleOpenChanged}>
      <IconButton icon="link" toggled={isLink || isEntityLink} onClick={handleToggleButton} />
      {openDialog === 'entity' && (
        <AdminEntitySelectorDialog
          title="Select entity"
          entityTypes={fieldSpec.linkEntityTypes}
          onItemClick={(entity) => {
            editor.dispatchCommand(TOGGLE_ADMIN_ENTITY_LINK_COMMAND, { id: entity.id });
            setOpenDialog(null);
          }}
        />
      )}
      {openDialog === 'link' && (
        <CreateLinkDialog
          onCreateLink={() => {
            setOpenDialog(null);
            showLinkPrompt(editor);
          }}
          onCreateEntityLink={() => {
            setOpenDialog('entity');
          }}
        />
      )}
    </Dialog2.Trigger>
  );
}

function showLinkPrompt(editor: LexicalEditor) {
  const url = window.prompt('Enter the URL', 'https://');
  const sanitizedUrl = sanitizeUrl(url);
  if (sanitizedUrl) {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizedUrl);
  }
}

function sanitizeUrl(url: string | null) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlObj.toString();
    }
  } catch (e) {
    // ignore
  }
  return null;
}
