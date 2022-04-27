import type { LogLevels, ToolSettings } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import type { FieldSpecification, ItemValuePath, RichText } from '@jonasb/datadata-core';
import { RichTextBlockType } from '@jonasb/datadata-core';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import type { LegacyDataDataContextValue, LegacyEntityFieldEditorProps } from '../..';
import { LegacyDataDataContext, IconButton, Row, RowItem } from '../..';
import type { LegacyEntityEditorDraftState } from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import type { EntityToolConfig } from './EntityTool';
import { createEntityToolFactory } from './EntityTool';
import {
  initializeLegacyRichTextState,
  reduceLegacyRichTextState,
  SetDataAction,
  SetInitializedAction,
} from './LegacyRichTextFieldReducer';
import type { ValueItemToolConfig } from './ValueItemTool';
import { createValueItemToolFactory } from './ValueItemTool';

export type LegacyRichTextFieldEditorProps = LegacyEntityFieldEditorProps<RichText>;

export function LegacyRichTextFieldEditor(
  props: LegacyRichTextFieldEditorProps
): JSX.Element | null {
  const context = useContext(LegacyDataDataContext);

  const { value, fieldSpec, onChange } = props;
  return (
    <div>
      <Row>
        <RowItem grow />
        {value !== null && value.blocks.length > 0 ? (
          <IconButton
            className="a"
            title={fieldSpec.list ? 'Remove item' : 'Clear'}
            icon="remove"
            onClick={() => onChange?.(null)}
          />
        ) : null}
      </Row>
      <RichTextEditor {...props} context={context} />
    </div>
  );
}

function RichTextEditor({
  id,
  value,
  fieldSpec,
  draftState,
  valuePath,
  context,
  onChange,
}: LegacyRichTextFieldEditorProps & { context: LegacyDataDataContextValue }) {
  const [editor, setEditor] = useState<EditorJS | null>(null);
  const [{ initialized, data, dataSetFromEditor }, dispatch] = useReducer(
    reduceLegacyRichTextState,
    { data: value },
    initializeLegacyRichTextState
  );

  useEffect(() => {
    const { tools, inlineToolbar } = initializeTools(context, fieldSpec, id, draftState, valuePath);
    setEditor(
      new EditorJS({
        holder: id,
        data: data ?? undefined,
        logLevel: 'WARN' as LogLevels,
        minHeight: 0,
        inlineToolbar,
        tools,
        onReady: () => dispatch(new SetInitializedAction()),
        onChange: (api) =>
          api.saver
            .save()
            .then(({ blocks }) => dispatch(new SetDataAction({ blocks }, true)))
            .catch(console.warn),
      })
    );
    return () => editor?.destroy?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value !== data) {
      dispatch(new SetDataAction(value, false));
      if (value) {
        editor?.render(value);
      } else {
        editor?.clear();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (dataSetFromEditor) {
      onChange?.(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dataSetFromEditor]);

  return (
    <div
      id={id}
      className="dd-text-body1 dd-rich-text dd-px-1"
      data-editorinitialized={initialized ? 'true' : 'false'}
    />
  );
}

function initializeTools(
  context: LegacyDataDataContextValue,
  fieldSpec: FieldSpecification,
  id: string,
  draftState: LegacyEntityEditorDraftState,
  valuePath: ItemValuePath
) {
  const standardTools: { [toolName: string]: ToolSettings } = {};
  const includeAll = !fieldSpec.richTextBlocks || fieldSpec.richTextBlocks.length === 0;

  const paragraphInlineToolbar = fieldSpec.richTextBlocks?.find(
    (x) => x.type === RichTextBlockType.paragraph
  )?.inlineTypes;
  standardTools[RichTextBlockType.paragraph] = {
    inlineToolbar: paragraphInlineToolbar ? paragraphInlineToolbar : true,
  } as ToolSettings;

  if (includeAll || fieldSpec.richTextBlocks?.find((x) => x.type === RichTextBlockType.entity)) {
    const config: EntityToolConfig = { id, fieldSpec, draftState, valuePath };
    standardTools[RichTextBlockType.entity] = {
      class: createEntityToolFactory(context),
      config,
    };
  }

  if (includeAll || fieldSpec.richTextBlocks?.find((x) => x.type === RichTextBlockType.valueItem)) {
    const config: ValueItemToolConfig = { id, fieldSpec, draftState, valuePath };
    standardTools[RichTextBlockType.valueItem] = {
      class: createValueItemToolFactory(context),
      config,
    };
  }

  const { tools, inlineToolbar } = context.getEditorJSConfig(fieldSpec, standardTools, [
    'bold',
    'italic',
    'link',
  ]);

  return { tools, inlineToolbar };
}
