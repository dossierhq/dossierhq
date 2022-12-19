import { useEffect, useState } from 'react';
import './App.css';

export default function App() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/message')
      .then((res) =>
        res.ok
          ? res.json()
          : { message: `Failed to fetch message: ${res.status} ${res.statusText}` }
      )
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <div className="App">
      <h1>Data data</h1>
      {message && <div className="card">Got: {message}</div>}
    </div>
  );
}
