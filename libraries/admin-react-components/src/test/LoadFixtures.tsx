import type { AdminClient, ErrorType, PromiseResult, Result } from '@jonasb/datadata-core';
import { EntityPublishState, notOk, ok } from '@jonasb/datadata-core';
import React, { useContext, useEffect, useState } from 'react';
import { DataDataContext2 } from '..';
import { entitiesFixture } from './EntityFixtures.js';

interface Props {
  children: React.ReactNode;
}

export function LoadFixtures({ children }: Props): JSX.Element | null {
  const { adminClient } = useContext(DataDataContext2);
  const [result, setResult] = useState<Result<void, ErrorType> | null>(null);
  useEffect(() => {
    (async () => {
      setResult(await loadFixtures(adminClient));
    })();
  }, [adminClient]);

  if (!result) {
    return null;
  }
  if (result.isOk()) {
    return <>{children}</>;
  }
  return (
    <h1>
      Failed loading fixtures: {result.error}: {result.message}
    </h1>
  );
}

async function loadFixtures(adminClient: AdminClient): PromiseResult<void, ErrorType> {
  for (const fixture of entitiesFixture) {
    const { id, type, name, archived, publishedVersion } = fixture;
    const latestVersion = fixture.versions.at(-1);
    if (!latestVersion) return notOk.BadRequest(`Fixture is missing version: ${id}`);

    const { _version, ...fields } = latestVersion;
    const upsertResult = await adminClient.upsertEntity({
      id,
      info: { type, name, authKey: 'none' },
      fields,
    });
    if (upsertResult.isError()) {
      return upsertResult;
    }

    //TODO how do I check the published version?
    if (
      typeof publishedVersion === 'number' &&
      ![EntityPublishState.Published, EntityPublishState.Modified].includes(
        upsertResult.value.entity.info.status
      )
    ) {
      const publishResult = await adminClient.publishEntities([{ id, version: publishedVersion }]);
      if (publishResult.isError()) return publishResult;
    }
    if (archived) {
      const archiveResult = await adminClient.archiveEntity({ id });
      if (archiveResult.isError()) return archiveResult;
    }
  }
  return ok(undefined);
}
