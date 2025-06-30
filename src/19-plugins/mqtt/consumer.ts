import mqtt from "mqtt";

async function consumer() {
  const client = await mqtt.connectAsync("mqtt://admin:admin@localhost:1883");

  const result = await client.subscribe("lampada");

  result.on("message", (topic, message) => {
    console.log(`Mensagem recebida no tópico ${topic}: ${message.toString()}`);
  });

}

consumer();
