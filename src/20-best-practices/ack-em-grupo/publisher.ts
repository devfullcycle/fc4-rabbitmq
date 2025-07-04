import * as amqp from "amqplib";

async function publisher() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const queue = "test";
  await channel.assertQueue(queue, { durable: true });

  for (let i = 1; i <= 25; i++) {
    const message = {
      number: i,
      content: `Mensagem número ${i}`,
      timestamp: new Date().toISOString()
    };

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      messageId: `msg-${i}`
    });

    console.log(`[publisher] Mensagem ${i} publicada`);
  }

  setTimeout(async () => {
    await channel.close();
    await connection.close();
    console.log("[publisher] Conexão encerrada");
  }, 500);
}

publisher().catch(console.error);