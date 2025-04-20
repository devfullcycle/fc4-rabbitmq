import amqp from "amqplib";

async function consumer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const queue = "hello";

  await channel.assertQueue(queue);
  console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

  channel.consume(
    queue,
    (msg) => {
      if (msg) {
        console.log(`[x] Received ${msg.content}`);
      }
    },
    { noAck: true }
  );
}

consumer().catch(console.error);
