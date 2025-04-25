import amqp from 'amqplib';

async function consume() {
  const conn = await amqp.connect('amqp://admin:admin@localhost:5672');
  const channel = await conn.createChannel();

  const exchange = 'amq.headers';
  const queue = 'pdf_queue';

  await channel.assertExchange(exchange, 'headers');
  await channel.assertQueue(queue);

  await channel.bindQueue(queue, exchange, '', {
    type: 'pdf',
    'x-match': 'all'
  });

  channel.consume(queue, msg => {
    if (msg) {
      console.log('PDF recebido:', msg.content.toString());
      channel.ack(msg);
    }
  });
}

consume();
