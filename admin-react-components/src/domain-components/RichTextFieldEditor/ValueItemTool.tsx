import type { FieldSpecification, Value } from '@datadata/core';
import type {
  BlockTool,
  BlockToolConstructable,
  BlockToolConstructorOptions,
  BlockToolData,
} from '@editorjs/editorjs';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { DataDataContextValue } from '../..';
import { DataDataContext, ValueTypeFieldEditor } from '../..';

export interface ValueItemToolConfig {
  id: string;
  fieldSpec: FieldSpecification;
}

export function createValueItemToolFactory(context: DataDataContextValue): BlockToolConstructable {
  // since EditorJS (most likely) does a deep clone of config, provide context through dynamic sub class
  const factoryClass = class extends ValueItemTool {
    constructor(config: BlockToolConstructorOptions<Value, ValueItemToolConfig>) {
      super(config, context);
    }
  };

  return (factoryClass as unknown) as BlockToolConstructable;
}

class ValueItemTool implements BlockTool {
  static get toolbox(): BlockToolConstructable['toolbox'] {
    return {
      title: 'Value item',
      icon:
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><g id="value-item"><g><path d="M4.938,4.644l2.062,4.712" style="fill:none;stroke:#707684;stroke-width:1.3px;"/><path d="M9.062,4.644l-2.062,4.712" style="fill:none;stroke:#707684;stroke-width:1.3px;"/></g></g></svg>',
    };
  }

  #config: ValueItemToolConfig;
  #data: Value | null;
  #context: DataDataContextValue;

  constructor(
    { api: _, data, config }: BlockToolConstructorOptions<Value, ValueItemToolConfig>,
    context: DataDataContextValue
  ) {
    if (!config) {
      throw new Error('Config is required');
    }
    this.#config = config;
    this.#data = Object.keys(data).length === 0 ? null : data;
    this.#context = context;
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div');
    ReactDOM.render(
      <Wrapper
        {...this.#config}
        context={this.#context}
        initialData={this.#data}
        onDataChange={(data) => (this.#data = data)}
      />,
      wrapper
    );
    return wrapper;
  }

  save(_block: HTMLInputElement): BlockToolData {
    return this.#data;
  }
}

function Wrapper({
  context,
  id,
  fieldSpec,
  initialData,
  onDataChange,
}: {
  context: DataDataContextValue;
  id: string;
  fieldSpec: FieldSpecification;
  initialData: Value | null;
  onDataChange: (data: Value | null) => void;
}) {
  const [value, setValue] = useState(initialData);
  onDataChange(value);

  return (
    <DataDataContext.Provider value={context}>
      <ValueTypeFieldEditor
        {...{ id, fieldSpec, schema: context.schema }}
        value={value}
        onChange={setValue}
      />
    </DataDataContext.Provider>
  );
}
