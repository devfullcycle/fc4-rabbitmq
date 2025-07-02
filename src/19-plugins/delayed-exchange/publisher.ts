import amqp from "amqplib";

async function publish() {
  const conn = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await conn.createChannel();

  const exchange = "delayed-exchange";
  await channel.assertExchange(exchange, "x-delayed-message", {
    arguments: {
      "x-delayed-type": "direct", //pode ser qualquer tipo de exchange
    },
  });
  await channel.assertQueue("queue.src.test", {
    arguments: {
      "x-queue-type": "quorum",
    },
  });
  await channel.bindQueue("queue.src.test", exchange, "routing.key.test");

  channel.publish(
    exchange,
    "routing.key.test",
    Buffer.from(JSON.stringify({ id: 1, name: "Mensagem 1" })),
    {
      headers: {
        "x-delay": 10000, // 10 segundos de atraso
      },
    }
  );

  setTimeout(() => {
    conn.close();
  }, 500);
}

publish();
