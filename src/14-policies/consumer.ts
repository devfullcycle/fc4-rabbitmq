//comando de policies
//rabbitmqctl set_policy retry.queue_dlx "retry.queue" '{"dead-letter-exchange":"amq.direct", "message-ttl": 5000}' --apply-to queues --priority 7
//rabbitmqctl set_policy nfe.queue_dlx "nfe.queue" '{"dead-letter-exchange":"dlx.exchange"}' --apply-to queues --priority 7
import amqp from "amqplib";

async function deadLetterExchange() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const queue = "nfe.queue";

  await channel.assertExchange("amq.direct", "direct");
  await channel.assertQueue(queue);
  await channel.bindQueue(queue, "amq.direct", 'order');
  await channel.assertQueue('fail.queue');

  await channel.assertExchange('dlx.exchange', 'direct');
  await channel.assertQueue('retry.queue', {
    'messageTtl': 5000,
    deadLetterExchange: 'amq.direct',
  });
  await channel.bindQueue('retry.queue', 'dlx.exchange', 'order');

  console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

  channel.consume(
    queue,
    (msg) => {
      // Simular processamento, apenas para fins didático
        const content = msg?.content.toString();
        if (!msg || !content) {
          console.log("[!] Received empty message, ignoring...");
          if(msg){
            const newMsg = {error: 'Received empty message', payload: ''};
            channel.sendToQueue('fail.queue', Buffer.from(JSON.stringify(newMsg)));
            channel.ack(msg);
          }
          return;
        }

        console.log(`[x] Received '${content}'`);

        try {
          // Simular sucesso ou falha
          if (parseInt(content) > 5) {
            throw new Error("Processing failed");
          }

          console.log("[x] Done processing");
          channel.ack(msg);
        } catch (error) {
          //se aconteceu um erro não reprocessável, publicar na fila de falha

          const maxRetries = 3;
          const xDeath = msg.properties.headers?.["x-death"]  || [];
          const retryCount = xDeath[0]?.count || 0;
          if(retryCount < maxRetries){
            channel.nack(msg, false, false); //channel.reject(msg, false);
            console.log(`[!] Retrying message, retry count: ${retryCount}`);
          }else{
            //@ts-expect-error
            const newMsg = {error: error.message, payload: content};
            channel.sendToQueue('fail.queue', Buffer.from(JSON.stringify(newMsg)));
            console.log(`[!] Sending message to fail queue`);
            channel.ack(msg);
          }

          //@ts-expect-error
          console.error("[!] Processing error:", error.message);
          

        }
    },
    { noAck: false }
  );
}

deadLetterExchange().catch(console.error);

