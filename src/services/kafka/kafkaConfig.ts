export const kafkaConfig = {
  clientId: "node-click-consumer",
  brokers: ["localhost:9092"],
  connectionTimeout: 3000,
  retry: {
    retries: 5,
  },
};
