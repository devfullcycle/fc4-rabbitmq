import * as amqp from "amqplib";

async function logsConsumer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const exchange = "xpto.direct";
  const queue = "logs-queue";
  const routingKeys = ["order.created", "order.updated"];

  await channel.assertExchange(exchange, "direct");
  await channel.assertQueue(queue);
  await Promise.all(
    routingKeys.map((routingKey) => {
      return channel.bindQueue(queue, exchange, routingKey);
    })
  );

  console.log(`[*] Waiting for messages in ${queue} (routingKeys: ${routingKeys.join(", ")})`);

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[logs] Received: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

logsConsumer().catch(console.error);