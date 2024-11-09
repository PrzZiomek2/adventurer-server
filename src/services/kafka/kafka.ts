import { Kafka, KafkaConfig } from "kafkajs";
import { DbService } from "../postgreSQL/postgreDb";

export class KafkaService {
  private kafka;
  private consumer;
  private dbService: DbService;
  private clickBatch: Place[] = [];

  constructor(kafkaConfig: KafkaConfig, dbService: DbService) {
    this.kafka = new Kafka(kafkaConfig);
    this.consumer = this.kafka.consumer({
      groupId: "click-group",
    });
    this.dbService = dbService;
  }

  async connect() {
    await this.consumer.connect();
    await this.dbService.init();
  }

  async subscribe(topic: string) {
    await this.consumer.subscribe({ topic, fromBeginning: true });
  }

  async run() {
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (message.value) {
          const clickEvent: Place = JSON.parse(message.value.toString());
          this.clickBatch.push(clickEvent);
        }

        if (this.clickBatch.length >= 10) {
          await this.dbService.insertClicksData(this.clickBatch);
          this.clickBatch = [];
        }
      },
    });

    setInterval(async () => {
      if (this.clickBatch.length) {
        await this.dbService.insertClicksData(this.clickBatch);
        this.clickBatch = [];
      }
    }, 5000);
  }

  async disconnect() {
    await this.consumer.disconnect();
  }
}
