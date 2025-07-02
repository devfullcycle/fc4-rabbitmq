import amqp from "amqplib";

async function publish() {
  const conn = await amqp.connect("amqp://admin:admin@localhost:5676");
  const channel = await conn.createChannel();

  const exchange = "amq.direct";

  const messages = new Array(1).fill(0).map((_, i) => ({
    id: i,
    name: `Mensagem ${i}`,
  }));

  for (const msg of messages) {
    channel.publish(exchange, "test", Buffer.from(JSON.stringify(msg)));
    // channel.sendToQueue('federation: amq.direct -> rabbit@rabbitmq-node1', Buffer.from(JSON.stringify(msg)), {
    //   persistent: true,
    // });
  }

  setTimeout(() => {
    conn.close();
  }, 500);
}

publish();
