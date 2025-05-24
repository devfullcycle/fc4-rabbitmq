import amqp from "amqplib";

async function publish() {
  const conn = await amqp.connect("amqp://admin:admin@rabbitmq-node1:5672");
  const channel = await conn.createChannel();

  const exchange = "amq.direct";
  await channel.assertExchange(exchange, "direct");
  //'x-queue-leader-locator'
  // - client-local - usar a conexão padrão para criar a fila no nó local
  // - balanced - se houver menos de 1000 filas no total (filas clássicas, filas de quórum e streams), 
  //    escolha o nó que hospeda o menor número de líderes de filas de quórum. 
  //    Se houver mais de 1000 filas no total, escolha um nó aleatório.
  await channel.assertQueue("queue1.test", {
    arguments: {
      "x-queue-type": "quorum",
      'x-queue-leader-locator': "balanced",
      //'x-quorum-initial-group-size': 2
    },
  });
  await channel.assertQueue("queue2.test", {
    arguments: { "x-queue-type": "quorum" },
  });

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
