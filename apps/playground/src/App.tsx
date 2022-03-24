import { useContext, useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import initSqlJs from "sql.js/dist/sql-wasm-debug";
import { ServerProvider } from "./components/ServerProvider";
import { ServerContext } from "./contexts/ServerContext";

function App() {
  //   useEffect(() => {
  //     (async () => {
  //       const SQL = await initSqlJs({
  //         locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  //       });
  //       const db = new SQL.Database();
  //       console.log(db)
  //       let sqlstr = "CREATE TABLE hello (a int, b char); \
  // INSERT INTO hello VALUES (0, 'hello'); \
  // INSERT INTO hello VALUES (1, 'world');";
  // db.run(sqlstr); // Run the query without returning anything

  // // Prepare an sql statement
  // const stmt = db.prepare("SELECT * FROM hello WHERE a=:aval AND b=:bval");

  // // Bind values to the parameters and fetch the results of the query
  // const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});
  // console.log(result); // Will print {a:1, b:'world'}

  //     })()
  //       .then()
  //       .catch(console.error);
  //   }, []);

  return (
    <ServerProvider>
      <AppContent />
    </ServerProvider>
  );
}

function AppContent() {
  const [count, setCount] = useState(0);
  const { server, error } = useContext(ServerContext);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>
          server: {!!server}, error: {error}
        </p>
        <p>
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {" | "}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  );
}

export default App;
