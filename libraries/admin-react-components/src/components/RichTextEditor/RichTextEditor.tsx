import type { LogLevels, ToolSettings } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import type {
  FieldSpecification,
  RichText,
  RichTextBlockSpecification,
} from '@jonasb/datadata-core';
import { RichTextBlockType } from '@jonasb/datadata-core';
import React, { useContext, useEffect, useId, useReducer, useState } from 'react';
import type { AdminDataDataContextAdapter } from '../../contexts/AdminDataDataContext';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import {
  initializeRichTextState,
  reduceRichTextState,
  RichTextActions,
} from './RichTextEditorReducer';

interface Props {
  fieldSpec: FieldSpecification;
  value: RichText | null;
  onChange: (value: RichText | null) => void;
  richTextBlocks?: RichTextBlockSpecification[];
}

export function RichTextEditor({ fieldSpec, value, onChange }: Props) {
  const { adapter } = useContext(AdminDataDataContext);
  const id = useId();
  const [editor, setEditor] = useState<EditorJS | null>(null);
  const [{ initialized, data, dataSetFromEditor }, dispatch] = useReducer(
    reduceRichTextState,
    { data: value },
    initializeRichTextState
  );

  useEffect(() => {
    const { tools, inlineToolbar } = initializeTools(adapter, fieldSpec);
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
      className="dd-text-body1 dd-rich-text dd-px-1"
      data-editorinitialized={initialized ? 'true' : 'false'}
    />
  );
}

function initializeTools(adapter: AdminDataDataContextAdapter, fieldSpec: FieldSpecification) {
  const standardTools: { [toolName: string]: ToolSettings } = {};
  // const includeAll = !richTextBlocks || richTextBlocks.length === 0;

  const paragraphInlineToolbar = fieldSpec.richTextBlocks?.find(
    (it) => it.type === RichTextBlockType.paragraph
  )?.inlineTypes;
  standardTools[RichTextBlockType.paragraph] = {
    inlineToolbar: paragraphInlineToolbar ? paragraphInlineToolbar : true,
  } as ToolSettings;

  // if (includeAll || richTextBlocks?.find((it) => it.type === RichTextBlockType.entity)) {
  //   const config: EntityToolConfig = { id, fieldSpec, draftState, valuePath };
  //   standardTools[RichTextBlockType.entity] = {
  //     class: createEntityToolFactory(context),
  //     config,
  //   };
  // }

  // if (includeAll || richTextBlocks?.find((it) => it.type === RichTextBlockType.valueItem)) {
  //   const config: ValueItemToolConfig = { id, fieldSpec, draftState, valuePath };
  //   standardTools[RichTextBlockType.valueItem] = {
  //     class: createValueItemToolFactory(context),
  //     config,
  //   };
  // }

  const { tools, inlineToolbar } = adapter.getEditorJSConfig(fieldSpec, standardTools, [
    'bold',
    'italic',
    'link',
  ]);

  return { tools, inlineToolbar };
}
