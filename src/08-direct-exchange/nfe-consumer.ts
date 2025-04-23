import * as amqp from "amqplib";

async function nfeConsumer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const exchange = "xpto.direct";
  const queue = "nfe-queue";
  const routingKey = "order.created";

  await channel.assertExchange(exchange, "direct");
  await channel.assertQueue(queue);
  await channel.bindQueue(queue, exchange, routingKey);

  console.log(`[*] Waiting for messages in ${queue} (routingKey: ${routingKey})`);

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[nfe-queue] Received: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

nfeConsumer().catch(console.error);