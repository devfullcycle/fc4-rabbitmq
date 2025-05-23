import amqp from "amqplib";

async function publish() {
  const conn = await amqp.connect("amqp://admin:admin@rabbitmq:5672");
  const channel = await conn.createChannel();

  const exchange = "amq.direct";
  await channel.assertExchange(exchange, "direct");
  await channel.assertQueue("queue1.test");
  await channel.assertQueue("queue2.test");

  const messages = new Array(10000).fill(0).map((_, i) => ({
    id: i,
    name: `Mensagem ${i}`,
    description: `Descrição da mensagem ${i}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "pending",
    priority: Math.floor(Math.random() * 10),
    tags: ["tag1", "tag2", "tag3"],
    data: {
      field1: `Valor 1 da mensagem ${i}`,
      field2: `Valor 2 da mensagem ${i}`,
      field3: `Valor 3 da mensagem ${i}`,
    },
    metadata: {
      source: "system",
      destination: "user",
      timestamp: new Date().toISOString(),
    },
  }));

  for (const msg of messages) {
    channel.sendToQueue("queue1.test", Buffer.from(JSON.stringify(msg)));
    channel.sendToQueue("queue2.test", Buffer.from(JSON.stringify(msg)));
  }

  setTimeout(() => {
    conn.close();
  }, 500);
}

publish();
