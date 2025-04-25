import amqp from 'amqplib';

async function consume() {
  const conn = await amqp.connect('amqp://admin:admin@localhost:5672');
  const channel = await conn.createChannel();

  const exchange = 'amq.headers';
  const queue = 'logs_queue';

  await channel.assertExchange(exchange, 'headers');
  await channel.assertQueue(queue);

  await channel.bindQueue(queue, exchange, '', {
    isFile: true,
    //xpto: 'xpto',
    'x-match': 'any'
  });

  channel.consume(queue, msg => {
    if (msg) {
      console.log('Log recebido:', msg.content.toString());
      channel.ack(msg);
    }
  });
}

consume();
