import {
  isRichTextEntityBlock,
  isRichTextParagraphBlock,
  isRichTextValueItemBlock,
  ok,
  RichTextBlockType,
} from '@datadata/core';
import type {
  ErrorType,
  FieldSpecification,
  PromiseResult,
  RichText,
  RichTextBlock,
} from '@datadata/core';
import type { CliContext } from '..';
import { editFieldValueItem, selectEntity } from '../CliEntityAdmin';
import type { ItemSelectorItem } from '.';
import { showJsonEdit, showStringEdit, showItemSelector, showMultiItemSelector } from '.';

export async function showRichTextEdit(
  context: CliContext,
  fieldSpec: FieldSpecification,
  message: string,
  defaultValue?: RichText | null
): Promise<RichText | null> {
  let exit = false;
  const result = defaultValue ? [...defaultValue.blocks] : [];
  let lastItemId: string | null = null;
  while (!exit) {
    const items = [
      ...result.map((block, index) => ({
        id: String(index),
        name: `${index + 1}: ${formatBlock(block)}`,
      })),
      { id: '_add', name: 'Add block' },
      { id: '_remove', name: 'Remove block', enabled: result.length > 0 },
      { id: '_done', name: 'Done' },
    ];
    const item: ItemSelectorItem = await showItemSelector(message, items, lastItemId);
    lastItemId = item.id;
    if (item.id === '_done') {
      exit = true;
    } else if (item.id === '_add') {
      const newItem = await editBlock(context, 'Create new block', fieldSpec, null);
      if (newItem.isOk() && newItem.value !== null) {
        result.push(newItem.value);
      }
    } else if (item.id === '_remove') {
      const itemsToRemove = await showMultiItemSelector(
        'Which blocks to remove?',
        result.map((x, index) => ({ id: String(index), name: `${index + 1}: ${formatBlock(x)}` }))
      );
      for (const item of itemsToRemove.reverse()) {
        result.splice(Number.parseInt(item.id), 1);
      }
    } else {
      const index = Number.parseInt(item.id);
      const block = result[index];
      const editedItem = await editBlock(context, block.type, fieldSpec, block);
      if (editedItem.isOk()) {
        if (editedItem.value !== null) {
          result[index] = editedItem.value;
        } else {
          result.splice(index, 1);
        }
      }
    }
  }

  return { blocks: result };
}

function formatBlock(block: RichTextBlock) {
  return block.type;
}

async function selectBlockType(fieldSpec: FieldSpecification) {
  if (fieldSpec.richTextBlocks && fieldSpec.richTextBlocks.length > 0) {
    const item = await showItemSelector(
      'Select rich text block type',
      fieldSpec.richTextBlocks.map((x) => ({ id: x.type, name: x.type }))
    );
    return item.id;
  }

  const item = await showItemSelector('Select rich text block type', [
    ...[RichTextBlockType.paragraph, RichTextBlockType.entity, RichTextBlockType.valueItem].map(
      (x) => ({ id: x, name: x })
    ),
    { id: '_other', name: 'Other...' },
  ]);
  if (item.id === '_other') {
    return await showStringEdit('Enter block type');
  }
  return item.id;
}

async function editBlock(
  context: CliContext,
  message: string,
  fieldSpec: FieldSpecification,
  block: RichTextBlock | null
): PromiseResult<RichTextBlock, ErrorType> {
  if (!block) {
    const type = await selectBlockType(fieldSpec);
    block = {
      type,
      data: type === RichTextBlockType.paragraph ? { text: '' } : null,
    };
  }
  if (isRichTextParagraphBlock(block)) {
    const newBlock = { ...block, data: { text: await showStringEdit(message, block.data.text) } };
    return ok(newBlock);
  }
  if (isRichTextEntityBlock(block)) {
    const entityResult = await selectEntity(
      context,
      message,
      { entityTypes: fieldSpec.entityTypes },
      block.data
    );
    if (entityResult.isError()) {
      return entityResult;
    }
    return ok({ ...block, data: { id: entityResult.value.id } });
  }
  if (isRichTextValueItemBlock(block)) {
    const valueItemResult = await editFieldValueItem(context, fieldSpec, block.data);
    if (valueItemResult.isError()) {
      return valueItemResult;
    }
    return ok({ ...block, data: valueItemResult.value });
  }

  const jsonResult = await showJsonEdit(block.type, block.data);
  if (jsonResult.isError()) {
    return jsonResult;
  }
  return ok({ ...block, data: jsonResult.value });
}
