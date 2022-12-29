import { EntitySamplingPayload } from '@jonasb/datadata-core';
import { useCallback, useEffect, useState } from 'react';
import { createAdminClient } from './ClientUtils.js';
import { AllAdminEntities } from './SchemaTypes.js';

const adminClient = createAdminClient();

export function IndexRoute() {
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
  }, [newMessage]);

  useEffect(() => {
    adminClient.sampleEntities({}, { seed: adminSampleSeed, count: 5 }).then((result) => {
      if (result.isOk()) setAdminSample(result.value);
    });
  }, [adminSampleSeed]);

  return (
    <div className="App">
      <h1>Data data</h1>
      {message && <div className="card">Got: {message}</div>}

      <h2>Create message entity</h2>
      <div className="card">
        <input onChange={(e) => setNewMessage(e.target.value)} value={newMessage} />
        <br />
        <button disabled={!newMessage} onClick={handleSendMessageClick}>
          Create
        </button>
      </div>

      <h2>Sample admin entities</h2>
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
  );
}
