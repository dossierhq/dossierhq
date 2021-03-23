import type { RichText } from '@datadata/core';
import type { LogLevels } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import React, { useEffect, useReducer, useState } from 'react';
import type { EntityFieldEditorProps } from '../..';
import { IconButton } from '../..';
import {
  initializeRichTextState,
  reduceRichTextState,
  SetDataAction,
  SetInitializedAction,
} from './RichTextFieldReducer';

export type RichTextFieldEditorProps = EntityFieldEditorProps<RichText>;

export function RichTextFieldEditor(props: RichTextFieldEditorProps): JSX.Element {
  const { value, fieldSpec, onChange } = props;
  return (
    <div>
      {value !== null ? (
        <IconButton
          title={fieldSpec.list ? 'Remove item' : 'Clear'}
          icon="remove"
          onClick={() => onChange?.(null)}
        />
      ) : null}
      <RichTextEditor {...props} />
    </div>
  );
}

function RichTextEditor({ id, value, onChange }: RichTextFieldEditorProps) {
  const [editor, setEditor] = useState<EditorJS | null>(null);
  const [{ initialized, data, dataSetFromEditor }, dispatch] = useReducer(
    reduceRichTextState,
    { data: value },
    initializeRichTextState
  );

  useEffect(() => {
    setEditor(
      new EditorJS({
        holder: id,
        data: data ?? undefined,
        logLevel: 'WARN' as LogLevels,
        minHeight: 0,
        onReady: () => dispatch(new SetInitializedAction()),
        onChange: (api) =>
          api.saver
            .save()
            .then((data) => {
              dispatch(new SetDataAction(data, true));
            })
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

  return <div id={id} data-editorinitialized={initialized ? 'true' : 'false'} />;
}
