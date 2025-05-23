import * as amqp from "amqplib";

async function consumer() {
  const connection = await amqp.connect("amqp://admin:admin@rabbitmq:5672");
  const channel = await connection.createChannel();

  const queue = "queue1.test";
  await channel.assertQueue(queue);

  console.log(`[*] Consumer aguardando tarefas. Para sair pressione CTRL+C`);

  channel.prefetch(500); // prefetch per channel

  //não tem limite - 5000
  // prefetch alto ou sem prefetch não representa necessariamente throughput

  channel.consume(
    queue,
    (msg) => {
      //sem ack para ver o comportamento no RabbitMQ Management

      //http
      // i/o

      // manual ack - rede
    },
    { noAck: false }
  );

  channel.prefetch(100);

  channel.consume(
    queue,
    (msg) => {
      //sem ack para ver o comportamento no RabbitMQ Management
    },
    { noAck: false }
  );
}

consumer();


//um consumer por processo
// - gerenciar os recursos
// - ter mais independência