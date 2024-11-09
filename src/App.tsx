import { useEffect, useState } from "react";
import "./App.css";

import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

import type { Int } from "apache-arrow";

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

function App() {
  const [result, setResult] = useState<any>(null);
  console.log(result);

  useEffect(() => {
    (async () => {
      // Select a bundle based on browser checks
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      // Instantiate the asynchronous version of DuckDB-wasm
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      const conn = await db.connect();
      setResult(
        await conn.query<{ v: Int }>(
          `SELECT count(*)::INTEGER as v FROM generate_series(0, 100) t(v)`
        )
      );
      console.log(result);

      await conn.close();
      await db.terminate();
      await worker.terminate();
    })();
  }, []);

  return (
    <>
      <pre style={{ textAlign: "left" }}>
        {JSON.stringify(Object.keys(result), undefined, 2)}
      </pre>
    </>
  );
}

export default App;
