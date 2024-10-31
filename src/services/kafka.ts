import { Kafka } from "kafkajs";
import { Pool } from "pg";
import "dotenv/config";

const pgData = {
  user: "postgres",
  password: process.env.PG_DB_PASSWORD,
  host: "localhost",
  port: 5432,
  database: process.env.PG_DB_NAME,
};

const kafka = new Kafka({
  clientId: "node-click-consumer",
  brokers: ["localhost:9092"],
  connectionTimeout: 3000,
  retry: {
    retries: 5,
  },
});

const consumer = kafka.consumer({ groupId: "click-group" });

interface Place {
  name: string;
  id: string;
  click_location: string;
}

let clickBatch: Place[] = [];

const pool = new Pool(pgData);

async function saveBatchToDatabase() {
  if (!clickBatch.length) return;

  const client = await pool.connect();
  try {
    const createTableQuery = `
          CREATE TABLE IF NOT EXISTS clicks (
            name VARCHAR(200) PRIMARY KEY,
            id VARCHAR(100),
            count_click_map INTEGER DEFAULT 0,
            count_click_details INTEGER DEFAULT 0
          );
        `;
    await client.query(createTableQuery);

    const insertDataQuery = `
          INSERT INTO clicks (name, id, count_click_map, count_click_details) 
          VALUES (
            $1, 
            $2, 
            CASE WHEN $3 = 'map' THEN 1 ELSE 0 END, 
            CASE WHEN $3 = 'details' THEN 1 ELSE 0 END
          )
          ON CONFLICT (name)
          DO UPDATE SET
            count_click_map = clicks.count_click_map + 
                (CASE WHEN EXCLUDED.count_click_map = 1 THEN 1 ELSE 0 END),
            count_click_details = clicks.count_click_details + 
                (CASE WHEN EXCLUDED.count_click_details = 1 THEN 1 ELSE 0 END),
            id = EXCLUDED.id;
        `;

    for (const data of clickBatch) {
      const { name, id, click_location } = data;
      await client.query(insertDataQuery, [name, id, click_location]);
    }
    clickBatch = [];
  } catch (error) {
    console.error("Error while saving batch to database:", error);
  } finally {
    client.release();
  }
}

export async function runKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "click-events", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const clickEvent = JSON.parse(message.value.toString());
      clickBatch.push(clickEvent);

      if (clickBatch.length >= 50) {
        await saveBatchToDatabase();
      }
    },
  });

  setInterval(saveBatchToDatabase, 5000);
}