import debounce from 'lodash/debounce.js';
import { SearchIcon } from 'lucide-react';
import { useMemo, useState, type Dispatch } from 'react';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
} from '../reducers/ContentListReducer.js';
import { Input } from './ui/input.js';

interface Props {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}

export function ContentListSearchSearchInput({ contentListState, dispatchContentList }: Props) {
  const [text, setText] = useState(contentListState.text);

  const handleChange = useMemo(() => {
    const handler = (value: string): void => {
      dispatchContentList(
        new ContentListStateActions.SetQuery(
          { text: value },
          { partial: true, resetPagingIfModifying: true },
        ),
      );
    };

    return debounce(handler, 300);
  }, [dispatchContentList]);

  return (
    <div className="relative flex-grow">
      <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search content..."
        className="pl-8"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          handleChange(e.target.value);
        }}
      />
    </div>
  );
}
