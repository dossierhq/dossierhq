import { Input } from '@dossierhq/design';
import debounce from 'lodash/debounce.js';
import { useMemo, useState, type Dispatch } from 'react';
import {
  SearchEntityStateActions,
  type SearchEntityState,
  type SearchEntityStateAction,
} from '../../reducers/SearchEntityReducer/SearchEntityReducer.js';

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
          { partial: true, resetPagingIfModifying: true },
        ),
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
