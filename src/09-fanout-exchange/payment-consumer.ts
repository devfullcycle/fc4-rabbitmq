import amqp from "amqplib";

const QUEUE_NAME = "payment-queue";

export async function startPaymentConsumer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  await channel.assertExchange("amq.fanout", "fanout");
  await channel.assertQueue(QUEUE_NAME);
  await channel.bindQueue(QUEUE_NAME, "amq.fanout", "");

  console.log("Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString());
      console.log("Processing payment for order:", order);

      // Simulate payment processing
      channel.ack(msg);
    }
  });
}

startPaymentConsumer();
