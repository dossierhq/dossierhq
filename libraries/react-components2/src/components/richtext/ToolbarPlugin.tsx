import {
  RichTextNodeType,
  type EntityReference,
  type RichTextFieldSpecification,
} from '@dossierhq/core';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import {
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
  getLanguageFriendlyName,
} from '@lexical/code-prism';
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
  type TextFormatType,
} from 'lexical';
import {
  BoldIcon,
  CheckIcon,
  ChevronDownIcon,
  CodeIcon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  PlusIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useReducer, useState, type JSX } from 'react';
import { useSchema } from '../../hooks/useSchema.js';
import {
  initializeContentListState,
  reduceContentListState,
} from '../../reducers/ContentListReducer.js';
import { assertExhaustive } from '../../utils/AssertUtils.js';
import { OpenContentDialogContent } from '../OpenContentDialogContent.js';
import { Button } from '../ui/button.js';
import { Dialog } from '../ui/dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.js';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group.js';
import { Toggle } from '../ui/toggle.js';
import { INSERT_COMPONENT_COMMAND } from './ComponentNode.js';
import { CreateLinkDialog } from './CreateLinkDialog.js';
import { $isEntityLinkNode, TOGGLE_ENTITY_LINK_COMMAND } from './EntityLinkNode.js';
import { INSERT_ENTITY_COMMAND } from './EntityNode.js';
import { getSelectedNode } from './lexical-playground/getSelectedNode.js';

const blockTypeToBlockName = {
  paragraph: { title: 'Paragraph', node: RichTextNodeType.paragraph, icon: PilcrowIcon },
  bullet: { title: 'Bulleted list', node: RichTextNodeType.list, icon: ListIcon },
  number: { title: 'Numbered list', node: RichTextNodeType.list, icon: ListOrderedIcon },
  check: { title: 'Check list', node: RichTextNodeType.list, icon: ListChecksIcon },
  h1: { title: 'Heading 1', node: RichTextNodeType.heading, icon: HeadingIcon },
  h2: { title: 'Heading 2', node: RichTextNodeType.heading, icon: HeadingIcon },
  h3: { title: 'Heading 3', node: RichTextNodeType.heading, icon: HeadingIcon },
  h4: { title: 'Heading 4', node: RichTextNodeType.heading, icon: HeadingIcon },
  h5: { title: 'Heading 5', node: RichTextNodeType.heading, icon: HeadingIcon },
  h6: { title: 'Heading 6', node: RichTextNodeType.heading, icon: HeadingIcon },
  code: { title: 'Code block', node: RichTextNodeType.code, icon: CodeIcon },
} satisfies Record<string, { title: string; node: RichTextNodeType; icon: LucideIcon }>;

type BlockTypeName = keyof typeof blockTypeToBlockName;

const textFormats: { format: TextFormatType; title: string; icon: LucideIcon }[] = [
  { format: 'bold', title: 'Bold', icon: BoldIcon },
  { format: 'italic', title: 'Italic', icon: ItalicIcon },
  { format: 'subscript', title: 'Subscript', icon: SubscriptIcon },
  { format: 'superscript', title: 'Superscript', icon: SuperscriptIcon },
  { format: 'code', title: 'Code', icon: CodeIcon },
  { format: 'underline', title: 'Underline', icon: UnderlineIcon },
  { format: 'strikethrough', title: 'Strikethrough', icon: StrikethroughIcon },
];

export function ToolbarPlugin({ fieldSpec }: { fieldSpec: RichTextFieldSpecification }) {
  const { schema } = useSchema();
  const [editor] = useLexicalComposerContext();

  const [blockType, setBlockType] = useState<BlockTypeName>('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);

  const [isLink, setIsLink] = useState(false);
  const [isEntityLink, setIsEntityLink] = useState(false);
  const [activeFormats, setActiveFormats] = useState<TextFormatType[]>([]);

  const [codeLanguage, setCodeLanguage] = useState<string>('');

  const [showAddEntityDialog, setShowAddEntityDialog] = useState(false);

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
      setActiveFormats(
        textFormats.map((it) => it.format).filter((format) => selection.hasFormat(format)),
      );

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));
      setIsEntityLink($isEntityLinkNode(parent) || $isEntityLinkNode(node));

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as BlockTypeName);
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

  const handleFormatChange = useCallback(
    (newFormats: string[]) => {
      // exactly one format is toggled per interaction, dispatch a command for it
      for (const { format } of textFormats) {
        const wasActive = activeFormats.includes(format);
        const isActive = newFormats.includes(format);
        if (wasActive !== isActive) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
        }
      }
    },
    [activeFormats, editor],
  );

  const enableAllNodes = !fieldSpec.richTextNodes || fieldSpec.richTextNodes.length === 0;
  const enableEntityNode =
    enableAllNodes || !!fieldSpec.richTextNodes?.includes(RichTextNodeType.entity);
  const enableLinkNode =
    enableAllNodes || !!fieldSpec.richTextNodes?.includes(RichTextNodeType.link);
  const enableEntityLinkNode =
    enableAllNodes || !!fieldSpec.richTextNodes?.includes(RichTextNodeType.entityLink);
  const enableComponentNode =
    (enableAllNodes || !!fieldSpec.richTextNodes?.includes(RichTextNodeType.component)) &&
    !!schema &&
    schema.getComponentTypeCount() > 0;

  const componentTypes = enableComponentNode
    ? fieldSpec.componentTypes.length > 0
      ? fieldSpec.componentTypes
      : (schema?.spec.componentTypes.map((it) => it.name) ?? [])
    : [];

  return (
    <div className="mb-2 flex items-center gap-2">
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
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={activeFormats}
            onValueChange={handleFormatChange}
          >
            {textFormats.map(({ format, title, icon: Icon }) => (
              <ToggleGroupItem key={format} value={format} aria-label={title} title={title}>
                <Icon />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {enableEntityLinkNode || enableLinkNode ? (
            <LinkAndEntityLinkButton
              fieldSpec={fieldSpec}
              enableEntityLinkNode={enableEntityLinkNode}
              enableLinkNode={enableLinkNode}
              isEntityLink={isEntityLink}
              isLink={isLink}
            />
          ) : null}
          {enableEntityNode || enableComponentNode ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <PlusIcon /> Insert
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {enableEntityNode ? (
                  <DropdownMenuItem onSelect={() => setShowAddEntityDialog(true)}>
                    Entity
                  </DropdownMenuItem>
                ) : null}
                {enableComponentNode ? (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Component</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {componentTypes.map((type) => (
                        <DropdownMenuItem
                          key={type}
                          onSelect={() =>
                            editor.dispatchCommand(INSERT_COMPONENT_COMMAND, { type })
                          }
                        >
                          {type}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </>
      )}
      {showAddEntityDialog ? (
        <SelectEntityDialog
          entityTypes={fieldSpec.entityTypes}
          onEntitySelected={(reference) => {
            editor.dispatchCommand(INSERT_ENTITY_COMMAND, reference);
            setShowAddEntityDialog(false);
          }}
          onClose={() => setShowAddEntityDialog(false)}
        />
      ) : null}
    </div>
  );
}

function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
  fieldSpec,
}: {
  blockType: BlockTypeName;
  editor: LexicalEditor;
  disabled: boolean;
  fieldSpec: RichTextFieldSpecification;
}): JSX.Element {
  const items = Object.entries(blockTypeToBlockName)
    .filter(([_blockType, blockConfig]) => {
      if (!fieldSpec.richTextNodes || fieldSpec.richTextNodes.length === 0) return true;
      return fieldSpec.richTextNodes.includes(blockConfig.node);
    })
    .map(([blockType, blockConfig]) => ({
      id: blockType as BlockTypeName,
      name: blockConfig.title,
      icon: blockConfig.icon,
    }));

  const currentBlockConfig = blockTypeToBlockName[blockType];
  const CurrentIcon = currentBlockConfig.icon;

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <CurrentIcon /> {currentBlockConfig.title} <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <DropdownMenuItem key={item.id} onSelect={() => handleItemClick(item)}>
              <ItemIcon /> {item.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {getLanguageFriendlyName(codeLanguage)} <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map((item) => (
          <DropdownMenuItem key={item.id} onSelect={() => handleItemClick(item)}>
            {item.id === codeLanguage ? <CheckIcon /> : <span className="size-4" />} {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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

  const handleToggleButton = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else if (isEntityLink) {
      editor.dispatchCommand(TOGGLE_ENTITY_LINK_COMMAND, null);
    } else if (enableLinkNode) {
      setOpenDialog('link');
    } else if (enableEntityLinkNode) {
      setOpenDialog('entity');
    }
  }, [editor, enableEntityLinkNode, enableLinkNode, isEntityLink, isLink]);

  return (
    <>
      <Toggle
        variant="outline"
        size="sm"
        aria-label="Link"
        title="Link"
        pressed={isLink || isEntityLink}
        onPressedChange={handleToggleButton}
      >
        <LinkIcon />
      </Toggle>
      {openDialog === 'entity' ? (
        <SelectEntityDialog
          entityTypes={fieldSpec.linkEntityTypes}
          onEntitySelected={(reference) => {
            editor.dispatchCommand(TOGGLE_ENTITY_LINK_COMMAND, reference);
            setOpenDialog(null);
          }}
          onClose={() => setOpenDialog(null)}
        />
      ) : null}
      {openDialog === 'link' ? (
        <CreateLinkDialog
          showEntityLink={enableEntityLinkNode}
          onCreateLink={(url) => {
            setOpenDialog(null);
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
          }}
          onCreateEntityLink={() => {
            setOpenDialog('entity');
          }}
          onClose={() => setOpenDialog(null)}
        />
      ) : null}
    </>
  );
}

function SelectEntityDialog({
  entityTypes,
  onEntitySelected,
  onClose,
}: {
  entityTypes: string[];
  onEntitySelected: (reference: EntityReference) => void;
  onClose: () => void;
}) {
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    { mode: 'full' as const, restrictEntityTypes: entityTypes },
    initializeContentListState,
  );

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <OpenContentDialogContent
        title="Select entity"
        contentListState={contentListState}
        dispatchContentList={dispatchContentList}
        onOpenEntity={(entityId) => onEntitySelected({ id: entityId })}
      />
    </Dialog>
  );
}
