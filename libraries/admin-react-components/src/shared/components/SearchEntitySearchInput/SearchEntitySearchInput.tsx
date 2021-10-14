import { Input } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../index.js';
import { SearchEntityStateActions } from '../../index.js';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}

export function SearchEntitySearchInput({ searchEntityState, dispatchSearchEntityState }: Props) {
  const { text } = searchEntityState;
  return (
    <Input
      iconLeft="search"
      value={text}
      placeholder="Search"
      onChange={(e) =>
        dispatchSearchEntityState(new SearchEntityStateActions.SetText(e.target.value))
      }
    />
  );
}
