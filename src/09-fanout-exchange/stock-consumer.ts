import amqp from "amqplib";

const QUEUE_NAME = "stock-queue";

export const startStockConsumer = async () => {
  try {
    const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
    const channel = await connection.createChannel();

    await channel.assertExchange("amq.fanout", "fanout");
    await channel.assertQueue(QUEUE_NAME);
    await channel.bindQueue(QUEUE_NAME, "amq.fanout", "");

    console.log("Stock consumer is waiting for messages...");

    channel.consume(QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString());
        console.log("Received order for stock update:", order);
        // Logic to update stock levels based on the order
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Error in stock consumer:", error);
  }
};

startStockConsumer();
