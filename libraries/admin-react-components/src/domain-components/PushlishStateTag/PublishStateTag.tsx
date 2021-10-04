import { EntityPublishState } from '@jonasb/datadata-core';
import React from 'react';
import { Tag } from '../../index.js';
import type { Kind } from '../../index.js';

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
