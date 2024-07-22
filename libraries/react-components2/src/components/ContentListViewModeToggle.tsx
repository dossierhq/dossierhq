import { Columns2Icon, ListIcon, MapIcon, Rows2Icon } from 'lucide-react';
import { type Dispatch } from 'react';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group.js';
import {
  ContentListStateActions,
  type ContentListState,
  type ContentListStateAction,
  type ContentListViewMode,
} from '../reducers/ContentListReducer.js';

export function ContentListViewModeToggle({
  contentListState,
  dispatchContentList,
}: {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
}) {
  return (
    <ToggleGroup
      className="bg-background"
      value={contentListState.viewMode}
      type="single"
      onValueChange={(value) => {
        if (value) {
          dispatchContentList(
            new ContentListStateActions.SetViewMode(value as ContentListViewMode),
          );
        }
      }}
    >
      <ToggleGroupItem value="list" title="View list">
        <ListIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="split" title="View split">
        <Columns2Icon className="hidden h-4 w-4 lg:block" />
        <Rows2Icon className="h-4 w-4 lg:hidden" />
      </ToggleGroupItem>
      <ToggleGroupItem value="map" title="View map">
        <MapIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
