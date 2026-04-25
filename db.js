import mysql from "mysql2";

export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Habib3004.",
  database: "AWTDB",
});

db.connect((err) => {
  if (err) {
    console.log("DB connection failed", err);
  } else {
    console.log("DB connected");
  }
});