import type { AdminClient, ErrorType, PromiseResult, Result } from '@dossierhq/core';
import { AdminEntityStatus, notOk, ok } from '@dossierhq/core';
import React, { useContext, useEffect, useState } from 'react';
import { AdminDossierContext } from '..';
import { entitiesFixture } from './EntityFixtures';

interface Props {
  children: React.ReactNode;
}

export function LoadFixtures({ children }: Props): JSX.Element | null {
  const { adminClient } = useContext(AdminDossierContext);
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
    const latestVersion = fixture.versions[fixture.versions.length - 1];
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
      !(
        upsertResult.value.entity.info.status === AdminEntityStatus.published ||
        upsertResult.value.entity.info.status === AdminEntityStatus.modified
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
