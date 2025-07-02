import * as amqp from "amqplib";

async function consumer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5673");
  const channel = await connection.createChannel();

  const queue = "test";

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[test-queue] Received: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

consumer().catch(console.error);