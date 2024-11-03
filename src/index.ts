import express, { NextFunction, Request, Response } from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import { Client } from "pg";
import router from "./routes";
import { DbService } from "./services/postgreSQL/postgreDb";
import { KafkaService } from "./services/kafka/kafka";
import { pgConfig } from "./services/postgreSQL/pgConfig";
import { kafkaConfig } from "./services/kafka/kafkaConfig";

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

export const client = new Client(pgConfig);

client.connect().then(() => {
  console.log("pg database connected");
});

app.use(router);

const runKafkaConsumer = async () => {
  try {
    const dbService = new DbService(pgConfig);
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
