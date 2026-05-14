import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

db.connect()
  .then(() => {
    console.log("PostgreSQL connected");
    console.log("DATABASE_URL =", process.env.DATABASE_URL);
  })
  .catch((err) => {
    console.log("DB connection failed", err);
  });

export default db;