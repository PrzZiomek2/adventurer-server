import express, { NextFunction, Request, Response } from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import { Client } from "pg";
import "dotenv/config";
import router from "./routes";
import { DbService } from "./services/postgreDb";
import { KafkaService } from "./services/kafka";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(compression({ threshold: 512 }));

app.use((_: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, PUT, POST, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

export const pgData = {
  user: "postgres",
  password: process.env.PG_DB_PASSWORD,
  host: "localhost",
  port: 5432,
  database: process.env.PG_DB_NAME,
};

const kafkaConfig = {
  clientId: "node-click-consumer",
  brokers: ["localhost:9092"],
  connectionTimeout: 3000,
  retry: {
    retries: 5,
  },
};

export const client = new Client(pgData);

client.connect().then(() => {
  console.log("pg database connected");
});

app.use(router);

const runKafkaConsumer = async () => {
  try {
    const dbService = new DbService(pgData);
    const kafkaService = new KafkaService(kafkaConfig, dbService);

    await kafkaService.connect();
    await kafkaService.subscribe("click-events");
    await kafkaService.run();
  } catch (err) {
    console.log("Error while running kafka consumer:", err);
  }
};

runKafkaConsumer();

app.listen(port, () => {
  console.log(`server listening at http://localhost:${port}`);
});
