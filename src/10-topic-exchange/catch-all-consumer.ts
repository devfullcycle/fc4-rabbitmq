import amqp from "amqplib";

async function start() {
  const conn = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await conn.createChannel();

  const exchange = "amq.topic";
  const queue = "catch-all-queue";
  const routingKey = "#";

  await channel.assertExchange(exchange, "topic");
  await channel.assertQueue(queue);
  await channel.bindQueue(queue, exchange, routingKey);

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`[catch_all] Received (${msg.fields.routingKey}):`, msg.content.toString());
      channel.ack(msg);
    }
  });
}

start();
