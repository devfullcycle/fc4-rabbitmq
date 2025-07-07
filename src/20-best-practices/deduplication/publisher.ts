import * as amqp from "amqplib";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function publisher() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const exchange = "test-exchange";
  await channel.assertExchange(exchange, "x-message-deduplication", { //fanout
    durable: true,
    arguments: {
      'x-cache-size': 1000, // Tamanho do cache para deduplicação'
    },
  });

  const queue = "test";
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, "");

  for (let i = 1; i <= 25; i++) {
    const message = {
      number: i,
      content: `Mensagem número ${i}`,
      timestamp: new Date().toISOString(),
    };

    channel.publish(exchange, "", Buffer.from(JSON.stringify(message)), {
      persistent: true,
      messageId: `msg-${i}`, // O id não é analisado
      headers: {
        'x-deduplication-header': `msg-6`, // Usando o cabeçalho para deduplicação
      },
    });

    await sleep(100); // Simula um atraso entre as publicações

    console.log(`[publisher] Mensagem ${i} publicada`);
  }

  setTimeout(async () => {
    await channel.close();
    await connection.close();
    console.log("[publisher] Conexão encerrada");
  }, 500);
}

publisher().catch(console.error);
