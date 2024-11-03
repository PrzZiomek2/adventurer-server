import "dotenv/config";

export const pgConfig = {
  user: "postgres",
  password: process.env.PG_DB_PASSWORD,
  host: "localhost",
  port: 5432,
  database: process.env.PG_DB_NAME,
};
