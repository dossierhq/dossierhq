import { useEffect, useState } from 'react';
import './App.css';

export default function App() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/hello-world')
      .then((res) => res.json())
      .then((data) => setMessage(data.message));
  }, []);

  return (
    <div className="App">
      <h1>Data data</h1>
      {message && <div className="card">Message: {message}</div>}
    </div>
  );
}
