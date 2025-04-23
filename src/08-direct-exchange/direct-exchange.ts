import * as amqp from "amqplib";

interface OrderEvent {
  id: number;
  customer: string;
  event: string;
}



async function sendOrderEvents() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const exchange = "amq.direct";

  const ordersEvent: OrderEvent[] = [
    { id: 101, customer: "Alice", event: "order.created" },
    { id: 102, customer: "Bob", event: "order.updated" },
    { id: 103, customer: "Carol", event: "order.created" },
  ];

  for (let i = 0; i < ordersEvent.length; i++) {
    const order = ordersEvent[i];

    const routingKey = order.event;
    const message = JSON.stringify(order);
    await channel.publish(exchange, routingKey, Buffer.from(message) );
  }

  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

sendOrderEvents();
