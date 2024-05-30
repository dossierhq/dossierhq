import { useEntities } from '@/hooks/useEntities';

export function ContentListScreen() {
  const { connection } = useEntities({}, {});
  console.log(connection);

  if (connection === undefined) {
    return <div>Loading...</div>;
  }
  if (connection === null) {
    return <div>No matches</div>;
  }

  return (
    <div>
      <h1>Content List</h1>
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
