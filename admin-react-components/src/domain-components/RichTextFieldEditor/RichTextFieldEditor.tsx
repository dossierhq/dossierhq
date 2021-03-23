import type { RichText } from '@datadata/core';
import EditorJS from '@editorjs/editorjs';
import React, { useEffect, useMemo, useReducer } from 'react';
import type { EntityFieldEditorProps } from '../..';
import { IconButton } from '../..';
import {
  initializeRichTextState,
  reduceRichTextState,
  SetDataAction,
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
  const [{ data, dataSetFromEditor }, dispatch] = useReducer(
    reduceRichTextState,
    { data: value },
    initializeRichTextState
  );

  const editor = useMemo(() => {
    return new EditorJS({
      holder: id,
      data: data ?? undefined,
      onChange: (api) =>
        api.saver
          .save()
          .then((data) => {
            dispatch(new SetDataAction(data, true));
          })
          .catch(console.warn),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => editor.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value && value !== data) {
      dispatch(new SetDataAction(value, false));
      editor.render(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (dataSetFromEditor) {
      onChange?.(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dataSetFromEditor]);

  return <div id={id} />;
}
