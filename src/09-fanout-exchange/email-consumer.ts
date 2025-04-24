import amqp from "amqplib";

const QUEUE_NAME = "email-queue";

export async function startEmailConsumer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  await channel.assertExchange("amq.fanout", "fanout");
  await channel.assertQueue(QUEUE_NAME);
  await channel.bindQueue(QUEUE_NAME, "amq.fanout", "");

  console.log("Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);

  channel.consume(QUEUE_NAME, (msg) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString());
      console.log("Received order for email notification:", order);
      // Here you would add logic to send an email notification
      channel.ack(msg);
    }
  });
}

startEmailConsumer();
