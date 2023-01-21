import type { EntitySamplingPayload } from '@dossierhq/core';
import { useCallback, useEffect, useState } from 'react';
import { useAdminClient } from './ClientUtils.js';
import { Navbar } from './Navbar.js';
import type { AllAdminEntities } from './SchemaTypes.js';

export function IndexRoute() {
  const adminClient = useAdminClient();
  const [message, setMessage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [adminSampleSeed, setAdminSampleSeed] = useState(Math.random);
  const [adminSample, setAdminSample] = useState<EntitySamplingPayload<AllAdminEntities> | null>(
    null
  );

  useEffect(() => {
    fetch('/api/message')
      .then((res) =>
        res.ok
          ? res.json()
          : { message: `Failed to fetch message: ${res.status} ${res.statusText}` }
      )
      .then((data) => setMessage(data.message));
  }, []);

  const handleSendMessageClick = useCallback(async () => {
    if (!adminClient) return;
    const result = await adminClient.createEntity(
      {
        info: { type: 'Message', authKey: 'none', name: newMessage },
        fields: { message: newMessage },
      },
      { publish: true }
    );
    if (result.isOk()) {
      setNewMessage('');
    } else {
      alert(`Failed to create message: ${result.error}: ${result.message}`);
    }
  }, [adminClient, newMessage]);

  useEffect(() => {
    if (adminClient) {
      adminClient.sampleEntities({}, { seed: adminSampleSeed, count: 5 }).then((result) => {
        if (result.isOk()) setAdminSample(result.value);
      });
    }
  }, [adminClient, adminSampleSeed]);

  return (
    <>
      <Navbar current="home" />
      <div style={{ maxWidth: '30rem', marginRight: 'auto', marginLeft: 'auto' }}>
        <h1 style={{ fontSize: '2em' }}>Dossier</h1>
        {message && <div>Got: {message}</div>}

        <h2 style={{ fontSize: '1.75em' }}>Create message entity</h2>
        <div>
          <input onChange={(e) => setNewMessage(e.target.value)} value={newMessage} />
          <br />
          <button disabled={!newMessage} onClick={handleSendMessageClick}>
            Create
          </button>
        </div>

        <h2 style={{ fontSize: '1.75em' }}>Sample admin entities</h2>
        {adminSample && (
          <ul>
            {adminSample.items.map((it) => (
              <li key={it.id}>
                {it.info.type}: {it.info.name}
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setAdminSampleSeed(Math.random())}>Refresh</button>
      </div>
    </>
  );
}
