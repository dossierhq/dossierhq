import type { LogLevels, ToolSettings } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import type { FieldSpecification, RichText } from '@jonasb/datadata-core';
import { RichTextBlockType } from '@jonasb/datadata-core';
import React, { useEffect, useId, useState } from 'react';

interface Props {
  fieldSpec: FieldSpecification;
  value: RichText | null;
}

export function RichTextDisplay({ fieldSpec, value }: Props) {
  const id = useId();
  const [editor, setEditor] = useState<EditorJS | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const { tools, inlineToolbar } = initializeTools(fieldSpec);
    setEditor(
      new EditorJS({
        holder: id,
        data: value ?? undefined,
        logLevel: 'WARN' as LogLevels,
        minHeight: 0,
        readOnly: true,
        inlineToolbar,
        tools,
        onReady: () => setInitialized(true),
      })
    );
    return () => editor?.destroy?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value) {
      editor?.render(value);
    } else {
      editor?.clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      id={id}
      className="rich-text-editor"
      data-editorinitialized={initialized ? 'true' : 'false'}
    />
  );
}

function initializeTools(fieldSpec: FieldSpecification) {
  const standardTools: { [toolName: string]: ToolSettings } = {};
  // const includeAll = !fieldSpec.richTextBlocks || fieldSpec.richTextBlocks.length === 0;

  const paragraphInlineToolbar = fieldSpec.richTextBlocks?.find(
    (it) => it.type === RichTextBlockType.paragraph
  )?.inlineTypes;
  standardTools[RichTextBlockType.paragraph] = {
    inlineToolbar: paragraphInlineToolbar ? paragraphInlineToolbar : true,
  } as ToolSettings;

  //TODO configure tools
  //TODO add entity/value item tools

  // if (includeAll || fieldSpec.richTextBlocks?.find((it) => it.type === RichTextBlockType.entity)) {
  //   const config: EntityToolConfig = { fieldSpec };
  //   standardTools[RichTextBlockType.entity] = {
  //     class: createEntityToolFactory(adminDataDataContext, entityEditorDispatchContext),
  //     config,
  //   };
  // }

  // if (
  //   includeAll ||
  //   fieldSpec.richTextBlocks?.find((it) => it.type === RichTextBlockType.valueItem)
  // ) {
  //   const config: ValueItemToolConfig = { fieldSpec };
  //   standardTools[RichTextBlockType.valueItem] = {
  //     class: createValueItemToolFactory(adminDataDataContext, entityEditorDispatchContext),
  //     config,
  //   };
  // }

  // const { tools, inlineToolbar } = adminDataDataContext.adapter.getEditorJSConfig(
  //   fieldSpec,
  //   standardTools,
  //   ['bold', 'italic', 'link']
  // );

  return { tools: standardTools, inlineToolbar: ['bold', 'italic', 'link'] };
}
