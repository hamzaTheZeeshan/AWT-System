import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Serverless-friendly sizing: each function instance gets its own pool,
  // and your Postgres provider has a max connection limit, so keep this low.
  max: 5,
  idleTimeoutMillis: 30000,
});

db.connect()
  .then((client) => {
    console.log("PostgreSQL connected");
    client.release(); // return the client to the pool instead of leaking it
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
  });

export default db;