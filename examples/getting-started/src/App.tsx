import { EntitySamplingPayload } from '@jonasb/datadata-core';
import { useEffect, useState } from 'react';
import './App.css';
import { createAdminClient } from './ClientUtils.js';
import { AllAdminEntities } from './SchemaTypes.js';

const adminClient = createAdminClient();

export default function App() {
  const [message, setMessage] = useState<string | null>(null);
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

  useEffect(() => {
    adminClient.sampleEntities().then((result) => {
      if (result.isOk()) setAdminSample(result.value);
    });
  }, []);

  return (
    <div className="App">
      <h1>Data data</h1>
      {message && <div className="card">Got: {message}</div>}
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
    </div>
  );
}
