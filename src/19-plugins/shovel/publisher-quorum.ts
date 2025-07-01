import amqp from "amqplib";

async function publish() {
  const conn = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await conn.createChannel();

  const exchange = "amq.direct";
  await channel.assertExchange(exchange, "direct");
  await channel.assertQueue("queue.src.test", {
    arguments: {
      "x-queue-type": "quorum",
    },
  });

  const messages = new Array(10000).fill(0).map((_, i) => ({
    id: i,
    name: `Mensagem ${i}`,
  }));

  for (const msg of messages) {
    channel.sendToQueue("queue.src.test", Buffer.from(JSON.stringify(msg)));
    channel.publish(exchange, "routing.key.test", Buffer.from(JSON.stringify(msg)));
  }

  setTimeout(() => {
    conn.close();
  }, 500);
}

publish();
