const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "resume_screening",
  port: Number(process.env.DB_PORT) || 3306,
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to MySQL database");
  }
});

module.exports = connection;