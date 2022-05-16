import type {
  BlockTool,
  BlockToolConstructable,
  BlockToolConstructorOptions,
  BlockToolData,
} from '@editorjs/editorjs';
import type { EntityReference, FieldSpecification } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { AdminDataDataContextValue } from '../../contexts/AdminDataDataContext';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext';
import icons from '../../icons';
import type { EntityEditorStateAction } from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { EntityTypeFieldEditor } from '../EntityEditor/EntityTypeFieldEditor';

export interface EntityToolConfig {
  fieldSpec: FieldSpecification;
}

export function createEntityToolFactory(
  adminDataDataContext: AdminDataDataContextValue,
  entityEditorDispatchContext: Dispatch<EntityEditorStateAction>
): BlockToolConstructable {
  // since EditorJS (most likely) does a deep clone of config, provide context through dynamic sub class
  const factoryClass = class extends EntityTool {
    constructor(config: BlockToolConstructorOptions<EntityReference, EntityToolConfig>) {
      super(config, adminDataDataContext, entityEditorDispatchContext);
    }
  };

  return factoryClass as unknown as BlockToolConstructable;
}

class EntityTool implements BlockTool {
  static get toolbox(): BlockToolConstructable['toolbox'] {
    return {
      title: 'Entity',
      icon: icons['entity-tool'],
    };
  }

  #config: EntityToolConfig;
  #data: EntityReference | null;
  adminDataDataContext: AdminDataDataContextValue;
  entityEditorDispatchContext: Dispatch<EntityEditorStateAction>;

  constructor(
    { api: _, data, config }: BlockToolConstructorOptions<EntityReference, EntityToolConfig>,
    adminDataDataContext: AdminDataDataContextValue,
    entityEditorDispatchContext: Dispatch<EntityEditorStateAction>
  ) {
    if (!config) {
      throw new Error('Config is required');
    }
    this.#config = config;
    this.#data = Object.keys(data).length === 0 ? null : data;
    this.adminDataDataContext = adminDataDataContext;
    this.entityEditorDispatchContext = entityEditorDispatchContext;
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'dd-py-1';
    ReactDOM.render(
      <Wrapper
        {...this.#config}
        adminDataDataContext={this.adminDataDataContext}
        entityEditorDispatchContext={this.entityEditorDispatchContext}
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
  adminDataDataContext,
  entityEditorDispatchContext,
  fieldSpec,
  initialData,
  onDataChange,
}: {
  adminDataDataContext: AdminDataDataContextValue;
  entityEditorDispatchContext: Dispatch<EntityEditorStateAction>;
  fieldSpec: FieldSpecification;
  initialData: EntityReference | null;
  onDataChange: (data: EntityReference | null) => void;
}) {
  const [value, setValue] = useState(initialData);
  onDataChange(value);

  return (
    <AdminDataDataContext.Provider value={adminDataDataContext}>
      <EntityEditorDispatchContext.Provider value={entityEditorDispatchContext}>
        <EntityTypeFieldEditor fieldSpec={fieldSpec} value={value} onChange={setValue} />
      </EntityEditorDispatchContext.Provider>
    </AdminDataDataContext.Provider>
  );
}
