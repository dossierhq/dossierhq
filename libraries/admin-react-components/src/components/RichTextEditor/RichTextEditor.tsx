import type { LogLevels, ToolSettings } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import type { FieldSpecification, RichText } from '@jonasb/datadata-core';
import { RichTextBlockType } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import React, { useContext, useEffect, useId, useReducer, useState } from 'react';
import type { AdminDataDataContextValue } from '../../contexts/AdminDataDataContext';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext';
import type { EntityEditorStateAction } from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import type { EntityToolConfig } from './EntityTool';
import { createEntityToolFactory } from './EntityTool';
import {
  initializeRichTextState,
  reduceRichTextState,
  RichTextActions,
} from './RichTextEditorReducer';
import type { ValueItemToolConfig } from './ValueItemTool';
import { createValueItemToolFactory } from './ValueItemTool';

interface Props {
  fieldSpec: FieldSpecification;
  value: RichText | null;
  onChange: (value: RichText | null) => void;
}

export function RichTextEditor({ fieldSpec, value, onChange }: Props) {
  const adminDataDataContext = useContext(AdminDataDataContext);
  const entityEditorDispatchContext = useContext(EntityEditorDispatchContext);
  const id = useId();
  const [editor, setEditor] = useState<EditorJS | null>(null);
  const [{ initialized, data, dataSetFromEditor }, dispatch] = useReducer(
    reduceRichTextState,
    { data: value },
    initializeRichTextState
  );

  useEffect(() => {
    const { tools, inlineToolbar } = initializeTools(
      adminDataDataContext,
      entityEditorDispatchContext,
      fieldSpec
    );
    setEditor(
      new EditorJS({
        holder: id,
        data: data ?? undefined,
        logLevel: 'WARN' as LogLevels,
        minHeight: 0,
        inlineToolbar,
        tools,
        onReady: () => dispatch(new RichTextActions.SetInitialized()),
        onChange: (api) =>
          api.saver
            .save()
            .then(({ blocks }) => dispatch(new RichTextActions.SetData({ blocks }, true)))
            .catch(console.warn),
      })
    );
    return () => editor?.destroy?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value !== data) {
      dispatch(new RichTextActions.SetData(value, false));
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
      className="rich-text-editor"
      data-editorinitialized={initialized ? 'true' : 'false'}
    />
  );
}

function initializeTools(
  adminDataDataContext: AdminDataDataContextValue,
  entityEditorDispatchContext: Dispatch<EntityEditorStateAction>,
  fieldSpec: FieldSpecification
) {
  const standardTools: { [toolName: string]: ToolSettings } = {};
  const includeAll = !fieldSpec.richTextBlocks || fieldSpec.richTextBlocks.length === 0;

  const paragraphInlineToolbar = fieldSpec.richTextBlocks?.find(
    (it) => it.type === RichTextBlockType.paragraph
  )?.inlineTypes;
  standardTools[RichTextBlockType.paragraph] = {
    inlineToolbar: paragraphInlineToolbar ? paragraphInlineToolbar : true,
  } as ToolSettings;

  if (includeAll || fieldSpec.richTextBlocks?.find((it) => it.type === RichTextBlockType.entity)) {
    const config: EntityToolConfig = { fieldSpec };
    standardTools[RichTextBlockType.entity] = {
      class: createEntityToolFactory(adminDataDataContext, entityEditorDispatchContext),
      config,
    };
  }

  if (
    includeAll ||
    fieldSpec.richTextBlocks?.find((it) => it.type === RichTextBlockType.valueItem)
  ) {
    const config: ValueItemToolConfig = { fieldSpec };
    standardTools[RichTextBlockType.valueItem] = {
      class: createValueItemToolFactory(adminDataDataContext, entityEditorDispatchContext),
      config,
    };
  }

  const { tools, inlineToolbar } = adminDataDataContext.adapter.getEditorJSConfig(
    fieldSpec,
    standardTools,
    ['bold', 'italic', 'link']
  );

  return { tools, inlineToolbar };
}
