'use client';

import { Button } from '../components/ui/button.js';
import { useEntities } from '../hooks/useEntities';

export function ContentListScreen() {
  const { connection } = useEntities({}, {});

  if (connection === undefined) {
    return <div>Loading...</div>;
  }
  if (connection === null) {
    return <Button>No matches</Button>;
  }

  return (
    <div>
      <h1>Content List</h1>
      <Button>Hello</Button>
      <ul>
        {connection.edges.map((edge) => {
          if (edge.node.isError())
            return (
              <li key={edge.cursor}>
                {edge.node.error} - {edge.node.message}
              </li>
            );
          return <li key={edge.cursor}>{edge.node.value.info.name}</li>;
        })}
      </ul>
    </div>
  );
}
