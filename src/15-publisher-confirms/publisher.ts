import amqp, { ConfirmChannel } from "amqplib";

const EXCHANGE_NAME = "amq.direct";

type Order = {
  id: number;
  customerName: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  createdAt: string;
};

export async function publishWithConfirms(
  channel: ConfirmChannel,
  exchange: string,
  routingKey: string,
  content: any
) {
  //ack/nack
  //return - primeiro - erro
  return Promise.race([
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error("Publish Timeout")), 5000)
    ),
    new Promise((resolve, reject) => {
      const onReturn = (msg: any) => {
        channel.off("return", onReturn);
        reject(
          new Error("Error publishing message", {
            cause: {
              replyCode: msg.fields.replyCode,
              replyText: msg.fields.replyText,
            },
          })
        );
      };

      channel.on("return", onReturn);

      channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(content)),
        { mandatory: true },
        (err, ok) => {
          if (err) {
            console.error("Message was not confirmed:", err);
            reject(err);
            return;
          }

          resolve(undefined);
        }
      );
    }),
  ]);
}

export async function publishOrder() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createConfirmChannel();

  await channel.assertExchange(EXCHANGE_NAME, "direct");

  const order: Order = {
    id: Math.floor(Math.random() * 1000000),
    customerName: "John Doe",
    items: [
      { productId: "123", quantity: 2 },
      { productId: "456", quantity: 1 },
    ],
    total: 100.0,
    createdAt: new Date().toISOString(),
  };

  await publishWithConfirms(channel, EXCHANGE_NAME, "order.created", order);

  // channel.on("return", (msg) => {
  //   console.error("Message returned:", msg);
  // });

  // channel.publish(
  //   EXCHANGE_NAME,
  //   "order.created",
  //   Buffer.from(JSON.stringify(order)),
  //   { mandatory: true },
  //   (err, ok) => {
  //     if (err) {
  //       console.error("Message was not confirmed:", err);
  //     } else {
  //       console.log("Message confirmed:", ok);
  //     }
  //   }
  // );
  // //rabbitmq falha - timeout
  // await channel.waitForConfirms();

  //muitas mensagens

  console.log("Order published:", order);

  setTimeout(async () => {
    await connection.close();
    process.exit(0);
  }, 500);
}

publishOrder()
  .then(() => console.log("Order published successfully"))
  .catch((error) => console.error(error));
