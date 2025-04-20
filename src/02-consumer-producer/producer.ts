import amqp from "amqplib";

async function producer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const queue = "hello";
  const message = "Hello World!";

  await channel.assertQueue(queue);
  channel.sendToQueue(queue, Buffer.from(message));

  console.log(`[x] Sent ${message}`);

  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

producer().catch(console.error);
