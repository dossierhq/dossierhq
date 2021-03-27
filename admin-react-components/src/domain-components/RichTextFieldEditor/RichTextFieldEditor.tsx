import type { RichText } from '@datadata/core';
import type { LogLevels } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import type { DataDataContextValue, EntityFieldEditorProps } from '../..';
import { DataDataContext, IconButton, Row, RowItem } from '../..';
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
    const valueItemConfig: ValueItemToolConfig = {
      id,
      fieldSpec,
    };
    setEditor(
      new EditorJS({
        holder: id,
        data: data ?? undefined,
        logLevel: 'WARN' as LogLevels,
        minHeight: 0,
        tools: {
          valueItem: {
            class: createValueItemToolFactory(context),
            config: valueItemConfig,
          },
        },
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
      className="dd text-body1"
      data-editorinitialized={initialized ? 'true' : 'false'}
    />
  );
}
