import amqp from "amqplib";

async function producer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const queue = "products";

  await channel.assertQueue(queue);

  const messages = new Array(10000).fill(0).map((_, i) => ({
    id: i,
    name: `Product ${i}`,
    price: Math.floor(Math.random() * 100),
  }));

  await Promise.all(
    messages.map((message) => {
      return channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        contentType: "application/json",
      });
    })
  );
  console.log(`[x] Sent messages`);

  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

producer().catch(console.error);
