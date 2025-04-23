import amqp from "amqplib";

async function startRPCServer() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  await channel.assertQueue("rpc_queue");
  
  //work queue
  channel.prefetch(1);

  console.log("[x] Aguardando requisições RPC");

  channel.consume("rpc_queue", (msg) => {
    if (msg) {
      const input = msg.content.toString();
      const result = input.toUpperCase();

      channel.sendToQueue(msg.properties.replyTo, Buffer.from(result), {
        correlationId: msg.properties.correlationId,
      });
      channel.ack(msg); //manual ack
    }
  });
}

startRPCServer();
