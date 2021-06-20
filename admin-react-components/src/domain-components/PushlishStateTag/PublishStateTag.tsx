import { EntityPublishState } from '@datadata/core';
import React from 'react';
import { Tag } from '../../';
import type { Kind } from '../../';

const LOOKUP: Record<EntityPublishState, Kind> = {
  [EntityPublishState.Archived]: 'danger',
  [EntityPublishState.Draft]: '',
  [EntityPublishState.Modified]: 'primary',
  [EntityPublishState.Published]: 'primary',
  [EntityPublishState.Withdrawn]: '',
};

interface Props {
  publishState: EntityPublishState;
}

export function PublishStateTag({ publishState }: Props): JSX.Element {
  return <Tag kind={LOOKUP[publishState]} text={publishState} />;
}
