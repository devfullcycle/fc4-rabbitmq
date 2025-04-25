import amqp from 'amqplib';

async function consume() {
  const conn = await amqp.connect('amqp://admin:admin@localhost:5672');
  const channel = await conn.createChannel();

  const exchange = 'amq.headers';
  const queue = 'video_queue';

  await channel.assertExchange(exchange, 'headers');
  await channel.assertQueue(queue);

  await channel.bindQueue(queue, exchange, '', {
    type: 'video',
    size: 'normal',
    'x-match': 'all'
  });

  channel.consume(queue, msg => {
    if (msg) {
      console.log('Vídeo normal recebido:', msg.content.toString());
      channel.ack(msg);
    }
  });
}

consume();
