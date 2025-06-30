import mqtt from "mqtt";

async function publish() {
  const client = await mqtt.connectAsync("mqtt://admin:admin@localhost:1883");

  //pub/sub
  await client.publishAsync("lampada", JSON.stringify({ status: "on" }));

  console.log("Mensagem publicada com sucesso!");

  await client.endAsync();
}

publish();
