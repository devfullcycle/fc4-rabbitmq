import amqp from "amqplib";
import crypto from "crypto";

async function toUpperCaseRPC(text: string): Promise<string> {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.assertQueue("rpc_queue");
  const correlationId = crypto.randomBytes(16).toString("hex");

  return new Promise<string>((resolve) => {
    channel.consume(
      q.queue,
      (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          resolve(msg.content.toString());
          setTimeout(() => connection.close(), 500);
        }
      },
      { noAck: true }
    ); 

    channel.sendToQueue("rpc_queue", Buffer.from(text), {
      correlationId,
      replyTo: q.queue,
    });
  });
}


toUpperCaseRPC("mensagem simples").then(console.log);
