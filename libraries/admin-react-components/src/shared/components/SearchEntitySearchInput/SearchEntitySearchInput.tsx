import { Input } from '@jonasb/datadata-design';
import debounce from 'lodash/debounce';
import type { Dispatch } from 'react';
import React, { useMemo, useState } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../..';
import { SearchEntityStateActions } from '../..';

interface Props {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}

export function SearchEntitySearchInput({ searchEntityState, dispatchSearchEntityState }: Props) {
  const [text, setText] = useState(searchEntityState.text);

  const handleChange = useMemo(() => {
    const handler = (value: string): void => {
      dispatchSearchEntityState(
        new SearchEntityStateActions.SetQuery(
          { text: value },
          { partial: true, resetPagingIfModifying: true }
        )
      );
    };

    return debounce(handler, 300);
  }, [dispatchSearchEntityState]);

  return (
    <Input
      iconLeft="search"
      value={text}
      placeholder="Search"
      onChange={(e) => {
        setText(e.target.value);
        handleChange(e.target.value);
      }}
    />
  );
}
