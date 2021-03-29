import type { FieldSpecification, RichText } from '@datadata/core';
import { RichTextBlockType } from '@datadata/core';
import type { LogLevels, ToolSettings } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import type { DataDataContextValue, EntityFieldEditorProps } from '../..';
import { DataDataContext, IconButton, Row, RowItem } from '../..';
import type { EntityToolConfig } from './EntityTool';
import { createEntityToolFactory } from './EntityTool';
import {
  initializeRichTextState,
  reduceRichTextState,
  SetDataAction,
  SetInitializedAction,
} from './RichTextFieldReducer';
import type { ValueItemToolConfig } from './ValueItemTool';
import { createValueItemToolFactory } from './ValueItemTool';

export type RichTextFieldEditorProps = EntityFieldEditorProps<RichText>;

export function RichTextFieldEditor(props: RichTextFieldEditorProps): JSX.Element | null {
  const context = useContext(DataDataContext);

  if (!context) {
    return null;
  }

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
  schema: _,
  context,
  onChange,
}: RichTextFieldEditorProps & { context: DataDataContextValue }) {
  const [editor, setEditor] = useState<EditorJS | null>(null);
  const [{ initialized, data, dataSetFromEditor }, dispatch] = useReducer(
    reduceRichTextState,
    { data: value },
    initializeRichTextState
  );

  useEffect(() => {
    const { tools, inlineToolbar } = initializeTools(context, fieldSpec, id);
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
            .then((data) => dispatch(new SetDataAction(data, true)))
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
      className="dd text-body1 rich-text"
      data-editorinitialized={initialized ? 'true' : 'false'}
    />
  );
}

function initializeTools(context: DataDataContextValue, fieldSpec: FieldSpecification, id: string) {
  const standardTools: { [toolName: string]: ToolSettings } = {};
  const includeAll = !fieldSpec.richTextBlocks || fieldSpec.richTextBlocks.length === 0;

  if (includeAll || fieldSpec.richTextBlocks?.find((x) => x.type === RichTextBlockType.entity)) {
    const config: EntityToolConfig = { id, fieldSpec };
    standardTools[RichTextBlockType.entity] = {
      class: createEntityToolFactory(context),
      config,
    };
  }

  if (includeAll || fieldSpec.richTextBlocks?.find((x) => x.type === RichTextBlockType.valueItem)) {
    const config: ValueItemToolConfig = { id, fieldSpec };
    standardTools[RichTextBlockType.valueItem] = {
      class: createValueItemToolFactory(context),
      config,
    };
  }

  if (
    !includeAll &&
    !fieldSpec.richTextBlocks?.find((x) => x.type === RichTextBlockType.paragraph)
  ) {
    standardTools[RichTextBlockType.paragraph] = { toolbox: false } as ToolSettings;
  }

  const { tools, inlineToolbar } = context.getEditorJSConfig(fieldSpec, standardTools, [
    'bold',
    'italic',
    'link',
  ]);

  return { tools, inlineToolbar };
}
