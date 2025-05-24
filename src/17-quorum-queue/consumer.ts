import * as amqp from "amqplib";

async function consumer() {
  const connection = await amqp.connect(
    "amqp://admin:admin@rabbitmq-node1:5672"
  );
  const channel = await connection.createChannel();

  const queue = "queue1.test";
  await channel.assertQueue(queue, {
    arguments: {
      "x-queue-type": "quorum",
      "x-queue-leader-locator": "balanced",
    },
  });

  console.log(`[*] Consumer aguardando tarefas. Para sair pressione CTRL+C`);

  channel.prefetch(500);

  channel.consume(
    queue,
    (msg) => {
      console.log(msg?.content.toString());
      channel.ack(msg!);
    },
    { noAck: false }
  );
}

consumer();

//dead-letter
//publisher-confirm -
