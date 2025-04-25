import amqp from 'amqplib';

async function consume() {
  const conn = await amqp.connect('amqp://admin:admin@localhost:5672');
  const channel = await conn.createChannel();

  const exchange = 'amq.headers';
  const queue = 'large_video_queue';

  await channel.assertExchange(exchange, 'headers');
  await channel.assertQueue(queue);

  await channel.bindQueue(queue, exchange, '', {
    type: 'video',
    size: 'large',
    //'x-xpto-etc': 'xpto',
    'x-match': 'all' // 'all' ou 'any', "any-with-x", "all-with-x"
  });

  channel.consume(queue, msg => {
    if (msg) {
      console.log('Vídeo GRANDE recebido:', msg.content.toString());
      channel.ack(msg);
    }
  });
}

consume();
